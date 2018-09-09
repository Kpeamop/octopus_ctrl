#!/bin/bash

while [ 1 = 1 ]
do
	echo test text out $1 $3 $5
	echo test text error $2 $4 $6 1>&2

	sleep 2
done