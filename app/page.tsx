import { getData, getSchema } from '@/lib/store';
import { DataTable } from '@/components/data-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DataViewerPage() {
  const schema = await getSchema();
  const data = await getData();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Data Viewer</CardTitle>
          <CardDescription>
            View, sort, and search your captured data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={schema} data={data} />
        </CardContent>
      </Card>
    </main>
  );
}
