import { Card, Skeleton } from "@/components/primitives";

const SKELETON_GROUPS = [
  ["a1", "a2", "a3", "a4"],
  ["b1", "b2", "b3"],
];

export function AppsSkeleton() {
  return (
    <output aria-busy="true" aria-label="Loading apps" className="block">
      <Skeleton className="mb-6 h-14 w-full" />
      {SKELETON_GROUPS.map((cards) => (
        <div key={cards[0]} className="mb-8">
          <Skeleton className="mb-3 h-3 w-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {cards.map((id) => (
              <Card key={id} className="p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-3 w-full" />
              </Card>
            ))}
          </div>
        </div>
      ))}
    </output>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <output aria-busy="true" aria-label={label} className="block space-y-4">
      <Skeleton className="h-6 w-48" />
      <Card className="space-y-4 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
      </Card>
    </output>
  );
}
