# Why we moved from Postgres to SQLite

We recently swapped Postgres out for SQLite as this app's database. That sounds like a downgrade if you think of SQLite as a toy, so here's the actual reasoning.

## The mismatch we were living with

Postgres is a client-server database built for many applications and many machines hitting shared data concurrently. Our app isn't that. It runs as a single instance, its dataset is a few gigabytes, and its traffic is overwhelmingly reads. We were paying the full operational cost of a database *server* — provisioning, connection pooling, credentials, upgrades, monitoring, network failure modes — for a workload that never needed one.

## What we got from the switch

**Fewer moving parts.** The database is now a file inside the app's own process. There is no server to run, patch, or lose connectivity to. An entire category of production incidents — connection pool exhaustion, auth misconfiguration, the database being up but unreachable — simply no longer exists.

**Latency.** Every Postgres query paid a network round trip. SQLite queries are function calls into the same process, so they return in microseconds. This changed how we write code: the classic N+1 query pattern, a performance bug over a network, is basically free in-process, which let us delete a lot of eager-loading and caching complexity.

**Dev and test environments got trivial.** Local setup used to mean running Postgres in Docker and keeping versions in sync. Now the database is a file: cloning the repo and running the app just works, tests run against a throwaway file or in-memory database, and copying production data for debugging is `cp`.

**Simpler backups.** Backups are file snapshots, and we stream every change offsite continuously with Litestream. Restore is: put the file back.

## The trade-offs, honestly

SQLite allows only one writer at a time, and it doesn't share a database across multiple app servers. That's fine for us — WAL mode lets reads proceed alongside the single writer, our write volume is low, and we deliberately run one instance. If we ever need horizontally scaled app servers or heavy concurrent writes, this decision gets revisited. But we'd rather carry the simple thing until it actually stops fitting than carry the complex thing forever just in case.

The takeaway isn't "SQLite is better than Postgres." It's that our app was shaped like a SQLite app all along, and we stopped paying for capabilities we weren't using.
