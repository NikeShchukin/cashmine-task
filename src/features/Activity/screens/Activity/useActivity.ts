import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchActivity } from "@/api/activity";

export function useActivity() {
  const query = useInfiniteQuery({
    queryKey: ["activity"],
    queryFn: ({ pageParam }) => fetchActivity(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  // The API repeats the boundary item on the next page (cursor is inclusive); dedupe by id.
  const items = [
    ...new Map((query.data?.pages.flatMap((p) => p.items) ?? []).map((i) => [i.id, i] as const)).values(),
  ];

  return {
    isLoading: query.isPending,
    // First-page error only; next-page errors keep the loaded rows.
    error: query.isError && !query.data ? query.error : null,
    nextPageError: query.isFetchNextPageError ? query.error : null,
    items,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    retry: () => {
      query.refetch();
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) {
        // Don't abort an in-flight page if onEndReached fires twice before re-render.
        query.fetchNextPage({ cancelRefetch: false });
      }
    },
    retryNextPage: () => {
      query.fetchNextPage();
    },
  };
}
