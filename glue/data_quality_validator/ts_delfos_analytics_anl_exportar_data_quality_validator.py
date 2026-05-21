# Dummy Glue script — local testing only
import sys
from awsglue.utils import getResolvedOptions

args = getResolvedOptions(sys.argv, [
    'JOB_NAME',
    'database_name',
    'account',
    'ENV',
])

print(f"[data_quality_validator] job={args['JOB_NAME']} db={args['database_name']} env={args['ENV']}")
print("[data_quality_validator] OK — dummy success")
