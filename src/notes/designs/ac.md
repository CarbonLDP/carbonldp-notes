# Authorization: Access Control (AC)

The platform's AC module gives document-based access control to clients. 

## Object model

### Subjects

Access control subjects (`cs:Subject`) are agents, represented by an IRI, that can have permissions over a certain 
resource. Right now the only subjects are:

- Users: `cs:User`
- Roles: `cs:Role`

Subjects can be related to other subjects; e.g. a `cs:User` having multiple `cs:Role`. In this case, the __main__ subject 
would be the `cs:User` while the `cs:Role`s would be __secondary__ subjects. 

#### Users

`cs:User`s are the main authenticatable subject of the platform. They represent any entity that can use it, which includes 
humans and programmatic agents.

#### Roles

`cs:Role`s group `cs:User`s into functional security roles (e.g. admins, editors, etc.). Using `cs:Role`s instead of directly referencing `cs:User`s in
`cs:AccessControlEntry`s, makes it easier to model the security model of an application since everything is tied to functionalities:

E.g. Instead of refering to `joe/` and providing permissions to that `cs:User`, the security model can refer to the functional role `editors/`. Which 
makes it easier to understand the security rules.

__Note:__ `cs:Role`s group users, but they aren't user groups. Meaning that they should be used to represent things like: `mexico-team-members/` or, 
`women/`. As of now the platform won't provide this functionality, but it is scheduled to be implemented in a future release.

#### Special subjects

##### System admin

`<%HOST%/.system/security/roles/system-admin/>` is a `cs:Role` that, by default, has all permissions over all 
documents. This role can't be deleted.

On a freshly started platform, the user `<%HOST%/users/system-admin/>` will exist. There are some important aspects
of this user:

- It has a `cs:UsernameAndPasswordCredentials` with the following default credentials:
    - __username:__ admin
    - __password:__ admin
- It has the `cs:Role` `<%HOST%/.system/security/roles/system-admin/>`
- It can't be deleted (but its credentials can be changed)

##### Authenticated user

`cs:AuthenticatedUser` is a `cs:Role` that any authenticated user has. If a `cs:AccessControlEntry` refers to this role,
any authenticated user will be targeted by it.

##### Anonymous user

`cs:AnonymousUser` is a special subject that all unauthenticated requests share. E.g. giving `cs:Read` permission 
to `cs:AnonymousUser` on a resource would mean exposing it to the world.

__Note:__ Authenticated users don't have this special subject as a secondary subject. Meaning that if `cs:AnonymousUser`
has `cs:Read` permission over certain resources, if the authenticated user doesn't receive that permission directly
or indirectly, it won't be able to read them.

##### Creator

When the AC module is active, every time a client creates a `cs:ProtectedDocument`, the platform adds the following property:

```
<created-document/> cs:createdBy <users/user-that-sent-the-request/> .
```

When performing an action to a `cs:ProtectedDocument`, the platform checks this property to see if the user making the
modification is the same user that created the `cs:ProtectedDocument`. If it is, the platform adds the secondary subject
`cs:Creator` to the authentication information of the action.

This means that if a `cs:AccessControlEntry` has for a `cs:subject` `cs:Creator`, that `cs:AccessControlEntry` will affect
agents that have as the main subject the `cs:createdBy` of the `cs:ProtectedDocument`.

### Protected documents

`cs:ProtectedDocument`s are `c:Document`s which access is restricted by an (optional) child `cs:AccessControlList` and
(optional) inherited `cs:AccessControlEntry`s.

When creating a child `c:Document`, if the AC module is on, the platform will add the type `cs:ProtectedDocument` to it.
Although there's an exception to this rule with `cs:AccessControlList` documents (as their access control works
differently). In summary, a `cs:AccessControlList` can't have its own `cs:AccessControlList`.

### Access control lists (ACLs)

`cs:AccessControlList`s are `c:Document`s that detail the security model of a `cs:ProtectedDocument` and its children.
They have the following properties:

- `cs:protectedDocument` - link to the `cs:ProtectedDocument` the security model applies to.
- `cs:accessControlEntry` - set of `cs:AccessControlEntry`s that apply directly to the `cs:protectedDocument`.
- `cs:inheritableAccessControlEntry` - set of `cs:AccessControlEntry`s that are inherited to any `cs:ProtectedDocument` 
descendants.

Example:

```text
<some-document/.acl/>
  # ... additional properties (e.g. c:Document)

  a cs:AccessControlList ;
  cs:protectedDocument <some-document/> ;
  cs:accessControlEntry 
    [
      # cs:AccessControlEntry
    ] , [
      # cs:AccessControlEntry
    ] ;
  cs:inheritableAccessControlEntry 
    [
      # cs:AccessControlEntry
    ] , [
      # cs:AccessControlEntry
    ] .
```

### Access control entries (ACEs)

`cs:AccessControlEntry`s are fragments of a `cs:AccessControlList` that relate subjects with permissions. They have the
following properties:

- `cs:subject` - Security subject (users, roles, etc.) to which the permissions are entailed (or restricted).
- `cs:permission` - Set of permissions this entry entails/restricts.
- `cs:granting` - Whether this entry entails (`"true"^^xsd:boolean`) or restricts (`"false"^^xsd:boolean`)

### Permissions

Permissions are resources that represent actions over a resource. Currently the platform will support the following ones:

- `cs:Read` - Read a `cs:ProtectedDocument`
- `cs:Update` - Add/Remove triples to the `cs:ProtectedDocument`
- `cs:Delete` - Delete the `cs:ProtectedDocument` (and all of its descendants)
- `cs:CreateChild` - Create child `c:Document`s of the `cs:ProtectedDocument` and (if enabled) add them as members
- `cs:CreateAccessPoint` - Create `c:AccessPoint`s on the `cs:ProtectedDocument`
- `cs:AddMember` - Add members to the `cs:ProtectedDocument`. These members can be external members (non-child members).
- `cs:RemoveMember` - Remove members of the `cs:ProtectedDocument`
- `cs:ControlAccess` - Modify the `cs:ProtectedDocument`'s `cs:AccessControlList`

<!-- TODO: Add link to section that describes algorithm for granting/removing permissions -->

## Permission evaluation algorithm

When a subject tries to perform an action over a `cs:ProtectedDocument`, the granting of the permission is based on:

1. Does the `cs:ProtectedDocument` have a `cs:accessControlList`?
    - __YES__:
        1. Does the `cs:AccessControlList` have a `cs:accessControlEntry` that mentions the exact subject and permission?
            - __YES__:
                1. Is the `cs:accessControlEntry` granting?
                    - __YES__: The action is __granted__
                    - __NO__: The action is __denied__
        2. Does the `cs:AccessControlList` have a `cs:accessControlEntry` that mentions one secondary subject and the required permission?
            - __YES__:
                1. Is the `cs:accessControlEntry` granting?
                    - __YES__: The action is __granted__
                    - __NO__: The action is __denied__
        3. Does the `cs:AccessControlList` have a `cs:accessControlEntry` that mentions more than one secondary subjects and the required permission?
            - __YES__: 
                1. Is any of those entries `cs:accessControlEntry` granting?
                    - __YES__: The action is __granted__
                    - __NO__: The action is __denied__
2. Does the `cs:ProtectedDocument` have a parent (defined as `<parent> ldp:contains <child>`)?
    - __YES__:
        1. Does the parent have a `cs:accessControlList`?
            - __YES__:
                1. Does the `cs:AccessControlList` have a `cs:inheritableAccessControlEntry` that mentions the exact subject and permission?
                    - __YES__:
                        1. Is the `cs:inheritableAccessControlEntry` granting?
                            - __YES__: The action is __granted__
                            - __NO__: The action is __denied__
                2. Does the `cs:AccessControlList` have a `cs:inheritableAccessControlEntry` that mentions one secondary subject and the required permission?
                    - __YES__:
                        1. Is the `cs:inheritableAccessControlEntry` granting?
                            - __YES__: The action is __granted__
                            - __NO__: The action is __denied__
                3. Does the `cs:AccessControlList` have a `cs:inheritableAccessControlEntry` that mentions more than one secondary subjects and the required permission?
                    - __YES__:
                        1. Is any of those entries `cs:accessControlEntry` granting?
                            - __YES__: The action is __granted__
                            - __NO__: The action is __denied__
        2. Evaluate step _2_ for the parent of the current parent document
3. The action is __denied__

## Creating/Modifying a cs:ProtectedDocument's cs:AccessControlList

`cs:AccessControlList` documents aren't `cs:ProtectedDocument`s. Therefore, the rules that govern actions against them are different.
Creating/modifying/deleting this documents is interpreted by the platform as making changes to the access control of its 
`cs:ProtectedDocument`.

When adding/removing a `cs:AccessControlEntry` from a `cs:AccessControlList` document, the platform evaluates the following
algorithm to determine if it allows the modification:

1. Does the agent have the `cs:ControlAccess` permission over the `cs:AccessControlList`'s `cs:ProtectedDocument`?
    - __NO__: The action is __denied__
2. Does the agent have the affected permissions over the `cs:AccessControlList`'s `cs:ProtectedDocument`?
    - __NO__: The action is __denied__
3. Is the modification affecting a main or secondary subject of the user?
    - __YES__: The action is __denied__
4. Is the modification affecting a subject that has a hierarchy (e.g. `cs:Role`)?
    - __YES__:
        1. Is the modification affecting a subject that is parent of one of the user's secondary subjects?
            - __YES__: The action is __denied__
5. The action is __granted__

## Relation with WebAC

There's a W3C evolving draft called [WebAC](https://www.w3.org/wiki/WebAccessControl) which certain LDP implementations
decided to support. Unfortunately, Carbon LDP will not implement this specification draft as it has several limitations:

- Doesn't support inheritance. It only supports "including" rules from other documents to avoid repetition.
- `acl:Authorization`s which are the "entries" of ACLs, connect permissions, subjects and resources. In our case, each
entry of an ACL needs to be able to have different combinations of permissions and subjects. Meaning that the ACL itself
dictates the protected resource, and its entries only permission/subject relationships.
- `acl:Access` are restricted to very generic actions and don't allow fine-tune control (e.g. restricting adding members, etc.).
This could be mitigated by creating our own `acl:Access`.
- The WebAC allows relating a set of `acl:Access` to a group of agents (like roles), by using `acl:agentClass`.
The value of this property should be an `rdf:Class` object and any __agent__ with that class would be targeted by the
`acl:Authorization`.
<br>
<br>
This does make sense semantically, as seeing this triple `<someone> a ex:Admin` feels natural. Unfortunately, user 
groups wouldn't be as semantically correct: `<board-members> a ex:BlogEditor`. Also, the LDP interface focuses gives much
more flexibility if the interaction with it is based around membership triples (and `rdf:type` isn't a good 
`ldp:hasMemberRelation`).
<br>
<br>
Because of this, the platform won't base user roles on classes/types, and rather go for a membership based approach.

## Security reports

Determining if a subject has access to a `cs:ProtectedDocument` or not can be quite tricky. 
That's why the platform will support preferences to retrieve security reports with information on
if and why a __subject__ has which permissions.

### User report

Report that shows information about all permissions the authenticated user has (or doesn't) over a 
`cs:ProtectedDocument`.

<!-- TODO: Design -->

### Subjects report

Report that shows information about all the permissions each readable subject has over a `cs:ProtectedDocument`.

<!-- TODO: Design -->

## Notes

### TODOs:

- Rename `system-admin/` role to `system-admins/`

### Open questions

- Should the system be granting or denying by default?

    __DECISION:__ Denying by default. Meaning that any action is denied unless something states that it shouldn't

- What happens if two `cs:AccessControlEntry`s contradict each other? E.g. an entry states that the role `editors/`
    has `cs:Read` permission over a resource, but another one (on the same inheritance level) states that the role 
    `authors/` doesn't. If a subject with those two roles as secondary subjects tries to read the resource, should 
    the platform allow it?
    - _Cody_: The platform should allow it if the user is in any role that allows it, even if the user is also in a role that disallows it
- Should the inheritance be to all descendants? Or should it apply only to direct children? Or should we give both options?
    - _Cody_: Allow inheritance always ALL THE WAY DOWN. Expect users to override grant at some level as needed
    - Arguments for direct inheritance:
        <!-- TODO -->
    - Arguments for branch inheritance:
        <!-- TODO -->
    - Why not both? Some systems provide both types of inheritance and both of them make sense on certain cases

    __DECISION:__ The platform will provide both options

- Should the `system-admin` subject be a `cs:Role` or should it be a special `cs:User` (like in the previous platform)?
    - Should the `system-admin` subject be subject to the access control system? Or should it bypass all security
        (like before)?
    - _Cody_: The role should exist but the it shouldn't be able to remove the system user from that role (meaning 
        that that user will always bypass the security system)
    
    __DECISION:__ For now, the `system-admin/` user will be part of the `system-admins/` role and it will be subject to 
    the security model described by the data.

- How should the `cs:Permission` for managing the access control of a `cs:ProtectedDocument` be called?
    - `cs:ControlAccess`
    - `cs:ManageSecurity`
    - `cs:AdminSecurity`
    - `cs:ControlSecurity`
    - `cs:ManageAccessControl`
    - `cs:AdminAccessControl`

    __DECISION:__ `cs:ControlAccess`

- Should we have a way to turn off inheritance? E.g. What happens if someone restricts the access to a document but then
someone adds inheritable rules to parent documents that specify other subjects?
    - How should turning on/off the inheritance be seen by the platform? Would the action be considered as removing the
    applying permissions, and thus be subject to the creating/modificating `cs:AccessControlList` algorithm?
        - The platform would probably require that the security model is replicated on that `cs:ProtectedDocument` with the exception of what the
        user is trying to remove. If this is the case, turning off inheritance would be essentially creating a snapshot of what the security model
        was at that time, with some modifications.

- Who should be able to turn on/off inheritance?
- Should we implement the logic to allow direct modifications to `cs:CredentialSet`s?
- How can we give a role the permission `cs:RemoveMember` but prevent it from removing all members (even the ones it
doesn't have "control" over)? E.g. `roles/`
- Should we add the concept of an owner? `cs:Creator` falls short when you want to allow a `cs:Role` of the creator
to be the subject of the `cs:AccessControlEntry`s instead of the user itself (which sometimes it's too specific).
- Should we recommend and use the membership relationship as a way to "deactivate" a resource?
    
    Drawbacks:

    - The permissions required to manage members (`cs:AddMember` and `cs:RemoveMember`) don't depend on which member
        is being removed/added. This leads to situations where developers want to give permission to clients to remove
        certain members but not all of them.

    Alternative:

    - Encourage (and follow) developers to use their own system to enable/disable resources. E.g. a `c:enabled` flag, etc..

- Should we add the concept of ownership? Basically letting agents define who gets the special role `cs:Owner` based on
    an agent defined property (opposite to `cs:creator` which is maintained by the platform).

### Previous design session

- Don't create `cs:ACL` documents for `cs:ProtectedDocument`s that don't have security rules specified on them
    + When creating a `cs:ProtectedDocument`, the platform will create a link between it and its `cs:ACL`. But this `cs:ACL` won't be persisted to the database. Instead, the platform will return a `c:VolatileResource` when clients request the `cs:ACL` which can be used by the client to add security rules to it. After adding security rules to a `c:VolatileResource` & `cs:ACL`, the platform will save it as a persisted document.
- Implement preference to retrieve a security report of the access a user has over a document
- Implement preference to retrieve a security report of the access all subjects (readable by the user) have over a document

## Use cases

### Blog

#### Data model

`/`
    
| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|system-admins|ALL|-|ALL|
|developers|`cs:Read`<br>`cs:CreateChild`||ALL|

`/.system/`

__FLAGS:__ 

- `cs:inherits "false"^^xsd:boolean`

| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|system-admins|ALL|-|ALL|

`/.system/platform/`

| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|developers|`cs:Read`|||

`/.system/security/`

`/.system/security/credentials/`

| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|developers||||
|`password-reseter/`||`cs:Read`<br>`cs:Update`||
|`cs:Creator`||||

`/.system/security/credentials/:credential/`

| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|`users/:user/`|`cs:Read`<br>`cs:Update`|||

`/.system/security/roles/`

| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|developers|`cs:Read`<br>`cs:CreateChild`|`cs:CreateAccessPoint`||
|`cs:Owner`||`cs:Update`<br>`cs:Delete`||

`/.system/security/roles/:role/`
`/users/`
`/users/:user/`
`/posts/`
`/posts/:post/`
`/posts/:post/tags/`
`/posts/:post/comments/`
`/posts/:post/comments/:comment/`
`/tags/`
`/tags/:tag/`

Template:

| role |  direct  |  children  |  descendants  |
|------|:--------:|:----------:|:-------------:|
|system-admins||||
|developers||||
|moderators||||
|editors||||
|`cs:AuthenticatedUser`||||
|`cs:Creator`||||

#### Security model

##### Roles

- system-admins/
    - developers/
        - moderators/
            - editors/
- `cs:AuthenticatedUser` (readers)

##### Users

- `password-reseter/`