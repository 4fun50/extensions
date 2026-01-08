import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { execSync } from "child_process";
import { saveSelectedDevice, getSelectedDevice } from "./utils/storage.utils";

interface AudioDevice {
  name: string;
  type: string;
  channels: string;
  manufacturer: string;
}

export default function ListAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  useEffect(() => {
    // Load the currently selected device
    const loadSelectedDevice = async () => {
      const device = await getSelectedDevice();
      setSelectedDevice(device);
    };

    loadSelectedDevice();

    // Function to retrieve the list of audio devices
    const getAudioDevices = () => {
      try {
        // Execute system_profiler command to list audio devices
        const output = execSync("/usr/sbin/system_profiler SPAudioDataType").toString();

        // Parse the output to extract devices with audio input
        const deviceList: AudioDevice[] = [];
        const lines = output.split("\n");

        let currentDevice: Partial<AudioDevice> = {};
        let deviceName = "";

        for (const line of lines) {
          // Detect device name (indented with 8 spaces and ending with colon)
          // This pattern matches any device name regardless of starting character
          if (line.match(/^ {8}\S.*:$/)) {
            // If we had a device in progress with input channels, save it
            if (currentDevice.channels && deviceName) {
              deviceList.push({
                name: deviceName,
                type: currentDevice.type || "Unknown",
                channels: currentDevice.channels,
                manufacturer: currentDevice.manufacturer || "Unknown",
              });
            }

            // New device
            deviceName = line.trim().replace(":", "");
            currentDevice = {};
          }

          // Extract device information
          if (line.includes("Input Channels:")) {
            currentDevice.channels = line.split(":")[1].trim();
          }
          if (line.includes("Manufacturer:")) {
            currentDevice.manufacturer = line.split(":")[1].trim();
          }
          if (line.includes("Transport:")) {
            currentDevice.type = line.split(":")[1].trim();
          }
        }

        // Add the last device if it has input channels
        if (currentDevice.channels && deviceName) {
          deviceList.push({
            name: deviceName,
            type: currentDevice.type || "Unknown",
            channels: currentDevice.channels,
            manufacturer: currentDevice.manufacturer || "Unknown",
          });
        }

        setDevices(deviceList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting audio devices:", error);

        // Show more detailed error
        const errorMessage = error instanceof Error ? error.message : String(error);

        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: errorMessage,
        });
        setIsLoading(false);
      }
    };

    getAudioDevices();
  }, []);

  const handleSelectDevice = async (deviceName: string) => {
    await saveSelectedDevice(deviceName);
    setSelectedDevice(deviceName);

    await showToast({
      style: Toast.Style.Success,
      title: "Device Selected",
      message: `"${deviceName}" is now the active input device for the tuner`,
    });
  };

  return (
    <List isLoading={isLoading}>
      {devices.map((device, index) => (
        <List.Item
          key={index}
          title={device.name}
          subtitle={`${device.manufacturer} • ${device.channels} channel(s)`}
          accessories={[
            { text: device.type },
            ...(device.name === selectedDevice ? [{ icon: Icon.Checkmark, tooltip: "Currently selected" }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Select This Device"
                icon={Icon.Checkmark}
                onAction={() => handleSelectDevice(device.name)}
              />
              <Action.CopyToClipboard title="Copy Device Name" content={device.name} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
