# MarkLogic Search Parser & API

## Usage

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
| rs:returnQuery | Whether to return the query string as entered by the user with the results. | The value specified by the 'returnQuery' property in the search options, if the property does not exists then false. | 
| rs:returnParsedQuery | Whether to return the parsed query with the results. | The value specified by the 'returnParsedQuery' property in the search options, if the property does not exists then false. | 
| rs:returnCtsQuery | Whether to return the cts query with the results. | The value specified by the 'returnCtsQuery' property in the search options, if the property does not exists then false. | 
| rs:returnResults | Whether to return the results. | The value specified by the 'returnResults' property in the search options, if the property does not exists then true. | 
| rs:returnContent | Whether to return the document content with the results. | The value specified by the 'returnContent' property in the search options, if the property does not exists then true. | 
| rs:returnMatches | Whether to return match information with the results. | The value specified by the 'returnMatches' property in the search options, if the property does not exists then true. | 
| rs:returnFacets | Whether to return facet information with the results. | The value specified by the 'returnFacets' property in the search options, if the property does not exists then true. | 
| rs:returnOptions | Whether to return the search options used with the results. | The value specified by the 'returnOptions' property in the search options, if the property does not exists then false. | 

## Search Query Syntax

| Operator | Description | Example |
|----------|-------------|---------|
| AND | Join two expressions together using an 'and' query. | john AND doe |
| OR | Join two expressions together using an 'or' query. | john OR doe |
| ( ... ) | Group expressions together as a single expression | (john AND doe) OR bill |
| CONTAINS | Limit the scope of a search to properties contained by another property.| name CONTAINS john |
| NOT | Negate the following expression | NOT (john OR jane) |

### Constraints in Queries

| Operator | Description | Example |
|----------|-------------|---------|
| IS | Equality comparison. | NumberOfCats IS 15 |
| : | Equality comparison. | NumberOfCats:15 |
| EQ | Equality comparison. | NumberOfCats EQ 15 |
| LT | Less that comparison | HeartRate LT 100 |
| LE | Less than or equal to comparison | BloodPressure LE 125 |
| GT | Greater than comparison | BirthDate GT 1970-03-14 |
| GE | Greater than or equal to comparison | Age GE 65 |
| DNE | Does not exist comparison. This will return documents which do not contain a value for the constraint. | Name DNE |

