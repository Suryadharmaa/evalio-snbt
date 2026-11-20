# EVAL-004 question bank

## Schema and access

The question-bank migration adds stable question and passage identities, immutable published question versions and append-only passage versions. A question version binds its subtest and topic to a specific approved blueprint through a composite foreign key. Option positions are local to a version, with unique normalized choice text. The restricted key has a composite foreign key to the correct option in that same version. Separate records hold ownership, licensing, independent review, audit events, and student reports.

Every new table is in `evalio_private` with RLS enabled and direct API-role privileges revoked. The application uses signed user sessions and narrowly scoped PostgreSQL functions. Staff roles are assigned by a database operator through the existing private role table. The application needs no service-role key. Author and reviewer UUIDs are retained as editorial audit identifiers. Learner reports are deleted with their accounts.

## Staff workflow

1. An editor creates a single-choice draft, selects a versioned subtest and topic, adds two to five choices, and supplies the correct answer and explanation. A draft can attach an existing passage version or create a new passage snapshot. New or revised passages entered in the same form use the entered ownership and license. A distinct passage can be reused with its own previously recorded license.
2. The author submits a complete draft. The version becomes read-only while under review. Reviewers solve it independently, verify option uniqueness and content rights, and record notes. Approval requires agreement with the stored key. Either a rejection or a mismatched answer returns the version to draft and increments its review revision. A contributing author cannot review the lineage.
3. An admin publishes a revision with independent approval. Publishing a replacement retires the previous active version in the same transaction. An admin may also retire a version directly.
4. To correct a published or retired version, a staff author forks it to a new draft. Version IDs and their children remain intact for future historical-attempt foreign keys. Question mutations lock the stable identity and reject stale revisions.

The CMS at `/admin/questions` includes a plain-text preview, draft editing, the review queue, publication, version history, and question reports. Key and explanation fields accept writes and always start blank. Reviewers supply their own rationale. The interface does not display the authored explanation. The initial format renders text only. A versioned render payload is reserved for later validated math and media.

## Learner read and report contract

- `GET /api/v1/questions/{versionId}` returns the published stem, passage and ordered choices to a signed-in account. Drafts, in-review versions, and retired versions return 404. The question-read RPC exposes stems, passages, and choices. [Authenticated practice](PRACTICE.md) retrieves feedback for an individual item after the owner’s answer is committed.
- `POST /api/v1/questions/{versionId}` accepts a same-origin report with `reason` set to `content`, `answer`, `rendering`, or `other`, plus optional `notes`. The database derives the reporter from the signed session and records at most one report per account and version. Historical retired versions can still be reported.
- Future selection must use the published status. A later answer-review endpoint will need attempt ownership and submission checks before it can return any key or explanation.

## Isolated testing and QA progress

Apply the migration after EVAL-003 in an isolated environment. Run `supabase test db --local`. Standard CI has a credential-free build and guest access tests. For the signed-in CMS test, create four synthetic confirmed local Auth accounts with the required preview privacy metadata. The test fixture addresses are `evalio-editorial-{editor,reviewer,admin,learner}@example.com`, with the password defined in the test. Assign the three corresponding staff roles through an authorized local database operator. Leave the learner without a staff role. Run `EVALIO_TEST_EDITORIAL=1 npm run test:e2e -- --project=chromium-desktop tests/e2e/editorial.spec.ts` with the loopback configuration in [Student accounts](ACCOUNTS.md).

The engineering fixtures cover all seven subtests. They are synthetic and do not count toward the editorial target. A separate private review batch has two AI-assisted original drafts per subtest. Drafts were structurally validated and kept outside the public repository. They have not been loaded into the published bank. Confirm attribution and rights and use an independent human reviewer before publication. For licensed material, record an agreement that grants commercial redistribution rights.

| Editorial state | Count |
|---|---:|
| Draft | 14 |
| Independently reviewed | 0 |
| Approved | 0 |
| Rejected | 0 |
| Published | 0 |

The 70 independently reviewed items remain an open acceptance criterion. Hosted staging verification remains open. [Authenticated practice](PRACTICE.md) consumes published content and grants submission-gated explanations.
