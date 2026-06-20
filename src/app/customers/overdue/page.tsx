import { CustomerListPage } from "../customer-list-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OverdueCustomersPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  return <CustomerListPage view="overdue-followups" searchParams={searchParams} />;
}
