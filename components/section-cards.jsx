import { IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      {/* Total Revenue */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs">Total Revenue</CardDescription>
          <CardTitle className="text-2xl tabular-nums @[250px]/card:text-xl">
            Tsh 0.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs px-1">
              <IconTrendingUp className="size-3" />
              + 0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start mt-3 text-xs">
          <div className="line-clamp-1 flex gap-1 font-medium">
            Start the trend now <IconTrendingUp className="size-3" />
          </div>
          <div className="text-muted-foreground italic">
            Nothing has been recorded yet
          </div>
        </CardFooter>
      </Card>

      {/* Raw Material Purchased */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs">Materials Purchased</CardDescription>
          <CardTitle className="text-2xl tabular-nums @[250px]/card:text-xl">
            Tsh 0.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs px-1">
              <IconTrendingUp className="size-3" />
              + 0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start mt-3 text-xs">
          <div className="line-clamp-1 flex gap-1 font-medium">
            Waiting for purchase orders <IconTrendingUp className="size-3" />
          </div>
          <div className="text-muted-foreground italic">
            No material purchases recorded
          </div>
        </CardFooter>
      </Card>

      {/* Products Manufactured */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs">Products Manufactured</CardDescription>
          <CardTitle className="text-2xl tabular-nums @[250px]/card:text-xl">
            0 Units
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs px-1">
              <IconTrendingUp className="size-3" />
              + 0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start mt-3 text-xs">
          <div className="line-clamp-1 flex gap-1 font-medium">
            Production not started <IconTrendingUp className="size-3" />
          </div>
          <div className="text-muted-foreground italic">
            No finished goods manufactured yet
          </div>
        </CardFooter>
      </Card>

      {/* Goods Dispatched */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="text-xs">Goods Dispatched</CardDescription>
          <CardTitle className="text-2xl tabular-nums @[250px]/card:text-xl">
            0 Deliveries
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs px-1">
              <IconTrendingUp className="size-3" />
              + 0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start mt-3 text-xs">
          <div className="line-clamp-1 flex gap-1 font-medium">
            Dispatch pipeline empty <IconTrendingUp className="size-3" />
          </div>
          <div className="text-muted-foreground italic">
            No shipments completed yet
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}
