# MarkLogic Search Parser & API

# Installation

# Usage

The following parameters are supported:

| Parameter | Description | Default |
|-----------|-------------|---------|
| rs:q | A string specifying the search query to be performed. | none |
| rs:collection | A collection or array of collections to constrain the search to. | none |
| rs:directory | A directory or array of directories to constrain the search to. | none |
| rs:start | The offset in the result set to start returning results from. The first result is 1.  | 1 |
| rs:pageLength | The number of results to return per page. | 10 |
| rs:sort | The named sort order (in the search options) to sort by. | If the search options defines a defaultSortOrder, sort by that, else sort by score. |
| rs:reverse | Whether to reverse the specified sort order | false |
| rs:returnQuery | | The value specified by the 'returnQuery' property in the search options, if the property does not exists then false. | 
| rs:returnParsedQuery | | The value specified by the 'returnParsedQuery' property in the search options, if the property does not exists then false. | 
| rs:returnCtsQuery | | The value specified by the 'returnCtsQuery' property in the search options, if the property does not exists then false. | 
| rs:returnResults | | The value specified by the 'returnResults' property in the search options, if the property does not exists then true. | 
| rs:returnMatches | | The value specified by the 'returnMatches' property in the search options, if the property does not exists then true. | 
| rs:returnFacets | | The value specified by the 'returnFacets' property in the search options, if the property does not exists then true. | 
| rs:returnOptions | | The value specified by the 'returnOptions' property in the search options, if the property does not exists then false. | 

## The Matcher

