export interface BusinessType {
  id: string
  name: string
  query: string
}

export const DEFAULT_BUSINESS_TYPES: BusinessType[] = [
  { 
    id: 'all',
    name: 'All Businesses',
    query: 'small business local business establishment'
  },
  { 
    id: 'retail',
    name: 'Retail & Boutiques',
    query: 'retail store shop boutique local shop small business'
  },
  { 
    id: 'bookstores',
    name: 'Bookstores',
    query: 'bookstore book shop independent bookstore used books comic books'
  },
  { 
    id: 'cafes',
    name: 'Cafes & Bakeries',
    query: 'cafe coffee shop bakery patisserie tea house espresso'
  },
  { 
    id: 'restaurants',
    name: 'Restaurants',
    query: 'restaurant bistro dining local restaurant eatery food'
  },
  { 
    id: 'fashion',
    name: 'Fashion & Clothing',
    query: 'clothing store fashion boutique apparel vintage clothing thrift shop'
  },
  { 
    id: 'art',
    name: 'Art Galleries',
    query: 'art gallery exhibition space artist studio art museum contemporary art'
  },
  { 
    id: 'museums',
    name: 'Museums & Cultural Centers',
    query: 'museum cultural center history museum science center exhibition hall'
  },
  { 
    id: 'event_venues',
    name: 'Event Venues',
    query: 'event venue wedding venue conference center banquet hall reception venue'
  },
  { 
    id: 'bars',
    name: 'Bars & Breweries',
    query: 'bar pub brewery taproom cocktail lounge wine bar sports bar'
  },
  { 
    id: 'specialty',
    name: 'Specialty Shops',
    query: 'specialty store gift shop artisan shop craft store local goods boutique'
  },
  { 
    id: 'jewelry',
    name: 'Jewelry',
    query: 'jewelry store jeweler fine jewelry antique jewelry custom jewelry'
  },
  { 
    id: 'beauty',
    name: 'Beauty & Wellness',
    query: 'spa salon beauty wellness massage therapy day spa nail salon'
  },
  { 
    id: 'fitness',
    name: 'Fitness & Recreation',
    query: 'fitness studio gym yoga pilates dance studio martial arts'
  },
  { 
    id: 'hotels',
    name: 'Hotels & Accommodations',
    query: 'hotel boutique hotel inn bed breakfast resort lodging'
  },
  { 
    id: 'wineries',
    name: 'Wineries & Vineyards',
    query: 'winery vineyard wine tasting wine bar wine cellar'
  },
  { 
    id: 'florists',
    name: 'Florists',
    query: 'florist flower shop plant store garden center botanical'
  },
  { 
    id: 'photography',
    name: 'Photography',
    query: 'photography studio photo gallery camera shop portrait studio'
  },
  { 
    id: 'antiques',
    name: 'Antiques & Vintage',
    query: 'antique shop vintage store collectibles thrift store consignment'
  },
  { 
    id: 'music',
    name: 'Music Venues',
    query: 'music venue concert hall performance space live music club theater'
  },
  { 
    id: 'outdoor',
    name: 'Outdoor & Recreation',
    query: 'park garden botanical garden outdoor venue amphitheater'
  },
  { 
    id: 'community',
    name: 'Community Spaces',
    query: 'community center civic center library public space meeting venue'
  },
  { 
    id: 'entertainment',
    name: 'Entertainment Venues',
    query: 'entertainment center arcade game center bowling alley cinema theater'
  },
  { 
    id: 'markets',
    name: 'Markets & Food Halls',
    query: 'market food hall farmers market flea market artisan market'
  },
  { 
    id: 'home',
    name: 'Home & Decor',
    query: 'home decor furniture store interior design antique furniture'
  }
] 