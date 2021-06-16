#!/bin/sh
{
  echo '{}'
  echo '{"connection_id": "test"}'

  while true; do
    echo '{"connection_id": "test", "ping": {}}'
    sleep 5
  done
} | nc 127.0.0.1 3917
