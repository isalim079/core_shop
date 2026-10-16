import { useEffect, useMemo, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useInfiniteScroll = (
  queryFn: (queryString: string, options?: any) => any,
  baseParams: string,
  pageSize = 20,
  search = "",
  skip = false
) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fullQueryString = useMemo(() => {
    const urlParams = new URLSearchParams(
      baseParams?.startsWith("?") ? baseParams?.slice(1) : baseParams
    );
    urlParams.set("page", page.toString());
    urlParams.set("limit", pageSize.toString());
    if (search) {
      urlParams.set("search", search);
    } else {
      urlParams.delete("search");
    }
    return `?${urlParams.toString()}`;
  }, [baseParams, page, pageSize, search]);

  const { data, isLoading, isError, refetch, status, isFetching: isDataFetching } =
    queryFn(fullQueryString, { skip });

  useEffect(() => {
    if (skip) return;
    setItems([]);
    setPage(1);
    setHasMore(true);
    setIsFetching(true);
    refetch();
  }, [search, baseParams, refetch, skip]);

  useEffect(() => {
    if (skip) return;
    if (page === 1) {
      setItems(data?.data?.data ?? []);
      setHasMore((data?.data?.data?.length ?? 0) >= pageSize);
      setIsFetching(false);
    } else {
      if (data?.data?.data) {
        setItems((prev) => [...prev, ...(data.data.data ?? [])]);
        setHasMore((data.data.data.length ?? 0) >= pageSize);
        setIsFetching(false);
      } else {
        setHasMore(false);
      }
    }
  }, [data, skip]);

  const loadMore = () => {
    if (skip || isFetching || !hasMore || status !== "fulfilled") return;
    setIsFetching(true);
    setPage((p) => p + 1);
  };

  const reset = () => {
    setHasMore(true);
    setPage(1);
    if (!skip) refetch();
  };

  return {
    items,
    loadMore,
    hasMore,
    isFetching,
    isDataFetching,
    isLoading,
    isError,
    reset,
    refetch,
    status,
    pagination: data?.data?.pagination,
  };
};
