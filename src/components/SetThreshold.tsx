import { useState } from 'react';
import { useContractWrite } from '@/hooks/useContractWrite';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';

const DATA_TYPES = [
  { value: 0, label: 'Temperature', unit: '°C', example: '15-30' },
  { value: 1, label: 'Humidity', unit: '%', example: '30-70' },
  { value: 2, label: 'Pressure', unit: 'hPa', example: '950-1050' },
  { value: 3, label: 'Motion', unit: 'events', example: '0-100' },
  { value: 4, label: 'Light', unit: 'lux', example: '100-1000' },
  { value: 5, label: 'Sound', unit: 'dB', example: '30-80' },
];

export function SetThreshold() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceIndex, setDeviceIndex] = useState<number | null>(null);
  const [dataType, setDataType] = useState(0);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const { execute, isLoading } = useContractWrite();

  const { data: deviceInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getDeviceByString',
    args: deviceId ? [deviceId] : undefined,
    query: {
      enabled: !!deviceId,
    },
  });

  const handleCheckDevice = () => {
    if (deviceInfo && Array.isArray(deviceInfo)) {
      const [index, exists] = deviceInfo;
      if (exists) {
        setDeviceIndex(Number(index));
        toast({
          title: 'Device Found',
          description: `Device found at index ${index}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Device Not Found',
          description: 'This device is not registered',
        });
      }
    }
  };

  const handleSetThreshold = async () => {
    if (deviceIndex === null) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please verify device first',
      });
      return;
    }

    if (!minValue || !maxValue) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in both minimum and maximum values',
      });
      return;
    }

    if (Number(minValue) >= Number(maxValue)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Minimum value must be less than maximum value',
      });
      return;
    }

    try {
      const min = Math.floor(Number(minValue));
      const max = Math.floor(Number(maxValue));

      await execute(
        'setThreshold',
        [BigInt(deviceIndex), dataType, min, max],
        'Threshold set successfully',
        'Failed to set threshold'
      );

      toast({
        title: 'Success',
        description: `Threshold set for ${DATA_TYPES[dataType].label}: ${min}-${max} ${DATA_TYPES[dataType].unit}`,
      });

      setMinValue('');
      setMaxValue('');
    } catch (error) {
      console.error('Threshold error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Data Thresholds</CardTitle>
        <CardDescription>
          Define acceptable ranges for your device sensors to receive alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="thresholdDeviceId">Device ID</Label>
          <div className="flex gap-2">
            <Input
              id="thresholdDeviceId"
              placeholder="Enter device ID"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setDeviceIndex(null);
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleCheckDevice}
              variant="outline"
              disabled={!deviceId || isLoading}
            >
              Verify
            </Button>
          </div>
          {deviceIndex !== null && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <AlertCircle className="h-4 w-4" />
              Device verified (Index: {deviceIndex})
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="thresholdDataType">Data Type</Label>
          <select
            id="thresholdDataType"
            value={dataType}
            onChange={(e) => setDataType(Number(e.target.value))}
            disabled={isLoading || deviceIndex === null}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DATA_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.unit})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Example range: {DATA_TYPES[dataType].example} {DATA_TYPES[dataType].unit}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minValue">Minimum Value</Label>
            <Input
              id="minValue"
              type="number"
              step="0.01"
              placeholder="Min threshold"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              disabled={isLoading || deviceIndex === null}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxValue">Maximum Value</Label>
            <Input
              id="maxValue"
              type="number"
              step="0.01"
              placeholder="Max threshold"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              disabled={isLoading || deviceIndex === null}
            />
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Values outside this range will trigger an alert event on the blockchain
          </p>
        </div>
        <Button
          onClick={handleSetThreshold}
          disabled={isLoading || deviceIndex === null}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Setting Threshold...' : 'Set Threshold'}
        </Button>
      </CardContent>
    </Card>
  );
}
