curl -XPUT 'http://localhost:9955/places' -H 'Content-Type: application/json' -d '{"settings": {"number_of_shards": 1, "number_of_replicas": 0}, "mappings": {"properties": {"title": {"type": "text"}, "description": {"type": "text"}, "visit_date": {"type": "text"} }}  }'
{"acknowledged":true,"shards_acknowledged":true,"index":"places"}
