# WF-08 Pagination
Fetch all pages for the selected day.
Loop pageNo: call -> validate -> append -> stop when no next page/total reached.
Retry only the failed page; do not restart already successful pages.
Pagination is not retry.
