import { CustomerListPage } from "../customer-list-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function RedirectedCustomersPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  return <CustomerListPage view="redirected" searchParams={searchParams} />;
}
