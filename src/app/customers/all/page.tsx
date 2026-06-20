import { CustomerListPage } from "../customer-list-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AllCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  return <CustomerListPage view="all" searchParams={searchParams} />;
}
