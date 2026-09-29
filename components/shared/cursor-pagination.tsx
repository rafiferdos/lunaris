"use client"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
export function CursorPagination({
  page,
  pending,
  hasNext,
  previous,
  next,
}: {
  page: number
  pending: boolean
  hasNext: boolean
  previous: () => void
  next: () => void
}) {
  return (
    <Pagination className="mt-6" aria-label="Results pages">
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            disabled={page === 0 || pending}
            onClick={previous}
          >
            Previous
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="px-4">Page {page + 1}</span>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="outline"
            disabled={!hasNext || pending}
            onClick={next}
          >
            Next
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
