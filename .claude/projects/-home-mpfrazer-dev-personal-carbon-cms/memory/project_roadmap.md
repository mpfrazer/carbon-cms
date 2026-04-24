---
name: Feature roadmap
description: Agreed build order for remaining CMS features
type: project
---

Agreed feature build order (as of 2026-04-24):

1. Password reset — forgot-password + reset-password flow for all user roles
2. Scheduled post publishing — background job to publish posts when scheduledAt is reached
3. Draft preview — preview unpublished posts/pages from the admin
4. Sitemap — /sitemap.xml generated from published posts and pages
5. robots.txt — paired with sitemap
6. (duplicate of 3 in original list — skip)
7. Comment notifications — email admins when new comments arrive pending moderation
8. Media upload pipeline — verify S3 end-to-end, add delete with in-use check (warn if image referenced by a post or page)
9. API keys — key management for headless/external consumers
10. Rate limiting — protect the API from abuse
11. RSS feed — /feed.xml for blog posts
12. Avatar images — user-uploaded profile photos shown in the nav menu and on posts (lowest priority)

**Why:** Each item should live on its own clean branch off main.
