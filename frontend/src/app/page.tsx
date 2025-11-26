import SalesChart from "../components/SalesChart";

async function getSalesData() {
  try {
    const res = await fetch('http://localhost:4000/sales?tenantId=tenant-01', {
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

export default async function Home() {
  const salesData = await getSalesData();

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-gray-50 dark:bg-gray-900">
      <main className="w-full max-w-5xl flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sales Dashboard
        </h1>
        
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
