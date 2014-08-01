
module.exports = {
	"index": {
		"analysis": {
			"analyzer": {
				"default": {
					"type": "keyword"
				}
			}
		}
	},
	"mappings": {
		"_default_": {
			"_timestamp": {
				"enabled": true,
				"store": true
			},
			"properties": {
				"event": {
					"index": "not_analyzed",
					"type": "string",
					"store": true
				},
				"token": {
					"index": "not_analyzed",
					"type": "string",
					"store": true
				},
				"data": {
					"type": "object",
					"properties": {
						"$tsDate": {
							"index": "not_analyzed",
							"type": "date",
							"format": "dateOptionalTime",
							"store": true
						},
						"$ts": {
							"index": "not_analyzed",
							"type": "long",
							"store": true
						},
						"$userId": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"$uuid": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"email": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"name": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"firstName": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"lastName": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"revenue": {
							"index": "not_analyzed",
							"type": "long",
							"store": true
						},
						"price": {
							"index": "not_analyzed",
							"type": "long",
							"store": true
						},
						"ipAddress": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"referrer": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"referrerDomain": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"campaigns": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"id": {
							"index": "not_analyzed",
							"type": "string",
							"store": true
						},
						"testGroups": {
							"properties": {
								"name": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								},
								"value": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								}
							}
						},
						"location": {
							"type": "object",
							"properties": {
								"city": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								},
								"state": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								},
								"zip": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								},
								"address": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								},
								"country": {
									"index": "not_analyzed",
									"type": "string",
									"store": true
								},
								"geo": {
									"type": "geo_shape",
									"tree": "quadtree",
									"precision": "1m"
								}
							}
						}
					}
				}
			}
		}
	}
};