#!/usr/bin/env python3
import json
import sys

COLS = ["md", "wd", "ymd", "ywd", "mb", "mg"]


def lit(text):
    return "'" + str(text).strip().replace("'", "''") + "'"


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: month_sql.py rows.json  (keys: year, month, phak, khet, tambon, md, wd, ymd, ywd, mb, mg, new)")
    rows = json.load(open(sys.argv[1], encoding="utf-8"))
    months = {(int(r["year"]), int(r["month"])) for r in rows}
    if len(months) != 1:
        sys.exit("rows must all belong to one year and month, found: %s" % sorted(months))
    year, month = months.pop()
    keys = [(r["phak"], r["khet"], r["tambon"]) for r in rows]
    if len(set(keys)) != len(keys):
        sys.exit("the same ตำบล appears twice")
    values = []
    for r in rows:
        nums = [int(r[c]) for c in COLS] + [int(r["new"])]
        if min(nums) < 0:
            sys.exit("negative count in %s" % r["tambon"])
        values.append("(%d,%d,%s,%s,%s,%s)" % (year, month, lit(r["phak"]), lit(r["khet"]), lit(r["tambon"]), ",".join(map(str, nums))))
    total = sum(sum(int(r[c]) for c in COLS) + int(r["new"]) for r in rows)
    print("begin;")
    print("delete from public.sd_attendance where year = %d and month = %d;" % (year, month))
    print("insert into public.sd_attendance (year,month,phak,khet,tambon,md,wd,ymd,ywd,mb,mg,newcomers) values")
    print(",\n".join(values) + ";")
    print("commit;")
    print("select count(*) as rows, sum(total) as total from public.sd_attendance where year = %d and month = %d;" % (year, month))
    print("expect rows = %d, total = %d" % (len(rows), total), file=sys.stderr)


main()
