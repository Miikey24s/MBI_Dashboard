import SalesChart from "@/components/SalesChart";
import ExcelUpload from "@/components/ExcelUpload";
import DashboardTitle from "@/components/DashboardTitle";
import { API_BASE_URL } from "@/lib/config";
import { DEFAULT_TENANT } from "@/providers/TenantProvider";

async function getSalesData(tenantId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/sales?tenantId=${tenantId}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return null;
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tenantId = (resolvedSearchParams?.tenantId as string) || DEFAULT_TENANT;
  const salesData = await getSalesData(tenantId);

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-gray-50 dark:bg-gray-900">
      <main className="w-full max-w-5xl flex flex-col gap-8 pt-16">
        <DashboardTitle />
        
        <ExcelUpload initialCount={salesData?.length ?? 0} />

        {salesData ? (
          <SalesChart data={salesData} />
        ) : (
          <div className="p-4 text-red-500 bg-red-100 rounded-md">
            Error loading sales data. Please make sure the backend is running.
          </div>
        )}
      </main>
    </div>
  );
}
