import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Database, HardDrive } from 'lucide-react';

export function DeviceStats() {
  const { address } = useAccount();

  const { data: totalDevices } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'deviceCount',
  });

  const { data: totalRecords } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'dataRecordCount',
  });

  const stats = [
    {
      title: 'Total Devices',
      value: totalDevices?.toString() || '0',
      icon: HardDrive,
      description: 'Registered in system',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Active Devices',
      value: totalDevices?.toString() || '0',
      icon: Activity,
      description: 'Currently active',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Data Records',
      value: totalRecords?.toString() || '0',
      icon: Database,
      description: 'Total submissions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
