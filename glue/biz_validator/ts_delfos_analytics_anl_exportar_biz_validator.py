# Dummy Glue script — local testing only
import sys
from awsglue.utils import getResolvedOptions

args = getResolvedOptions(sys.argv, [
    'JOB_NAME',
    'database_name',
    'account',
    'ENV',
])

print(f"[biz_validator] job={args['JOB_NAME']} db={args['database_name']} env={args['ENV']}")
print("[biz_validator] OK — dummy success")
