//these functions are used to map grouped data for faster/cheaper querying when fetching items from database

//TODO:
export async function aggregatePaymentIntent() {
  //aggregations.successfulTransactions(up/down)
  //customers.successfulTransactions(up/down)
  //payment-links.successfulTransactions(up/down)
}

export async function aggregateCustomer() {
  //aggregations.customers
}

export async function aggregatePaymentLink() {
  //aggregations.paymentLinks(up/down)
}

export async function aggregateSubscription() {
  //aggregations.subscriptions(up/down)
  //payment-links.currentSubscriptionsCount(up/down)
  //customers.currentSubscriptionsCount(up/down)
}

//Helper ================>
//creates aggregation document by merchantUID in firestore if doesn't exist
//TODO: async function createAggregationMapIfNecessary() {}
