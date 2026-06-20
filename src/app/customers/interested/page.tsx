import { CustomerListPage } from "../customer-list-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function InterestedCustomersPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  return <CustomerListPage view="interested-without-registration" searchParams={searchParams} />;
}
