# Access Point: Easer Usage

Current Data:

```typescript
interface ADocument {
    "ex:relation": PersistedDocument[];
    "c:accessPoints": [ AnAccessPoint ];
}

interface AnAccessPoint {
    "ldp:hasMemberRelation": "ex:relation";
}
```

Cons:

- Simple REST GET request will not have information about the access points

## Proposal 1

> Every GET request will become a CONSTRUCT query request

- The queries will retrieve the access point `id` and the `ldp:hasMemberRelation`
- This information will be processed to add a  non `enumerable` property based in the relation name:

```typescript
const aDocument;

aDocument._relation;
aDocument.$relation;
aDocument[ "@relation" ];
```

> What about if the relation is not defined in the schema and cannot be compressed?

```typescript
const aDocument;

aDocument[ "_http://example.com/ns#relation" ]
aDocument[ "$http://example.com/ns#relation" ]
aDocument[ "@http://example.com/ns#relation" ]
```

## Proposal 2

> Add information of the access points in the document

### Data as a simple fragment

```typescript
interface ADocument {
    "ex:relation": PersistedDocument[];
    "c:accessPoints": {
        "@type": [ "c:AccessPointAccessor" ]
        "ex:relation": "./access-point-id/"; // AnAccessPoint
    };
}
```

```typescript
const aDocument;

aDocument.accessPoints.relation;
```

Cons:

- Every fragment is unique, so:
  - Will need a specific type for every different document, or
  - Use a modified schema of the document
  - Add feature `sub schemas`.
    - Make possible to define a sub-schema (only applied for fragments?)
    - And `AccessPointAccessor` decorator, to decore its content as `PersistedAccessPoints`

```typescript
// ADocument schema
{
    accessPoints: {
        "@type": "@id",
        "relation": {
            "@id": "ex:relation",
            "@type": "@id",
        }
    }
}
```

Technical

- Reducing the URI:
  - Re-generate document schema
  - Add method to "un-resolve" the property (Or make public the one used by the JSONLDCompactor)

### Data as a map

> Additional data will live in the document, but usage as Proposal #1

```typescript
interface ADocument {
    "ex:relation": PersistedDocument[];
    "c:accessPoints": {
        "@type": [ "c:Map" ];
        "c:entry": [
            {
                "c:key": "ex:relation";
                "c:value": "./access-point-id/"; // AnAccessPoint
            }
        ];
    };
}
```

Technical

- How to convert the data?
  - The `PersistedDocument` decorator, would convert the data?
    - If document updated, decorator would need to take consideration of this map has changed.
  - `JSONCompactor` would convert the data?

### Problems

1. Calls to `.get()` without a query parameter won't be able to retrieve the needed information of the document's access points.

### TODOs

1. Rename `isLocallyOutDated()` to `isOutdated`
2. Review design of plural methods, e.g. `createAccessPoints()` (regarding returning one or multiple promises)
3. Rename `PersistedX` to `X` and `X` to `InMemoryX` (TODO: Name to be determined)
4. Turn `documents` into a registered `Document` object
5. Move "special" methods from `documents` to `repository` (TODO: Name to be determined)

### Questions

- Should we use `documents` or `root` (or something else)?
  - Alvaro: `root` is a singular noun, that's why `root.create()` sounds weird...
  - ====> `documents`
- Should we use the root document as an enhanced document? Or should we use a separate service? (for methods like `register()`)
  - If not, where should `register()` be moved? To `CarbonLDP`?
  - How about `carbonldp.repository.register()`?
    - Alvaro: What other method would it have?
      - `getPointer`, `inScope`, etc.
  - ====> No. Methods related to pointers (and other to be defined things) will live inside a new object called: `carbonldp.repository`
- How should we name in-memory models? (`InMemory` | `Unpersisted` | `Transient`)
- Should we call the new property `repository` or `registry`?

```typescript
console.log( post.tags ); // PersistedDocument[]
console.log( post.$tags ); // PersistedDocument (tags/ AccessPoint)

post.$tags.addMember( tags.featured );


editors.$users.addMember( someUser );

// vs 

carbonldp.documents.addMember( editors.id + "users/", someUser );
```


```typescript
auth.roles
  .addUsers( "roles/123", [ "users/123" ] );

//

auth.roles.addMember( "editors/users/", someUser );
auth.roles.createChild( {} );
carbonldp.documents.createChild( {}  ); //.createChild( "" , {})

carbonldp.root.create()
carbonldp.root.get( "projects/123/" );
carbonldp.root.delete();
.delete( "some-document/" )

user.$posts.del();

roles.getMember( "editors/" );

auth.users.createChild();

User.create( base:UserBase ):InMemoryUser;

interface PersistedDocument {
    exists( uri:string ):Promise<boolean>;

    get( queryBuilderFn ):Promise<PersistedDocument>;
    get( uri:string, queryBuilderFn ):Promise<PersistedDocument>;

    listChildren():Promise<PersistedDocument[]>;
    listChildren( uri:string ):Promise<PersistedDocument[]>;

    listMembers():Promise<PersistedDocument[]>;
    listMembers( uri:string ):Promise<PersistedDocument[]>;

    getChildren( queryBuilderFn ):Promise<PersistedDocument[]>;
    getChildren( uri:string, queryBuilderFn ):Promise<PersistedDocument[]>;

    getMembers( queryBuilderFn ):Promise<PersistedDocument[]>;
    getMembers( uri:string, queryBuilderFn ):Promise<PersistedDocument[]>;

    refresh():Promise<PersistedDocument>;

    create( childObject:object ):Promise<PersistedDocument>;
    create( childObjects:object[] ):Promise<PersistedDocument[]>;
    create( uri:string, childObject:object ):Promise<PersistedDocument>;
    create( uri:string, childObjects:object[] ):Promise<PersistedDocument[]>;

    createAndRetrieve( childObject:object ):Promise<PersistedDocument>;
    createAndRetrieve( childObjects:object[] ):Promise<PersistedDocument[]>;
    createAndRetrieve( uri:string, childObject:object ):Promise<PersistedDocument>;
    createAndRetrieve( uri:string, childObjects:object[] ):Promise<PersistedDocument[]>;

    createAccessPoint( accessPoint:AccessPointBase ):Promise<PersistedAccessPoint>;
    createAccessPoint( uri:string, accessPoint:AccessPointBase ):Promise<PersistedAccessPoint>;

    createAccessPoints( accessPoints:AccessPointBase[] ):Promise<PersistedAccessPoint[]>;
    createAccessPoints( uri:string, accessPoints:AccessPointBase[] ):Promise<PersistedAccessPoint[]>;

    save():Promise<PersistedDocument>;
    saveAndRefresh():Promise<PersistedDocument>;

    addMember( member:(string | Pointer) ):Promise<void>;
    addMember( uri:string, member:(string | Pointer) ):Promise<void>;

    addMembers( members:(string | Pointer)[] ):Promise<void>;
    addMembers( uri:string, members:(string | Pointer)[] ):Promise<void>;

    removeMember( member:(string | Pointer) ):Promise<void>;
    removeMember( uri:string, member:(string | Pointer) ):Promise<void>;

    removeMembers( members:(string | Pointer)[] ):Promise<void>;
    removeMembers( uri:string, members:(string | Pointer)[] ):Promise<void>;

    removeAllMembers():Promise<void>;
    removeAllMembers( uri:string ):Promise<void>;

    delete():Promise<void>;
    delete( uri:string ):Promise<void>;

    // SPARQL(er) Methods
}
```
c