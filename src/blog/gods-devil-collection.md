---
layout: blog_post
title: "God's Devil: Introduction"
description: "Fiction gives Satan a mind that reads yours, a body that is everywhere at once, and a future he already knows. The Bible gives him none of that. This introduction lays out the premise behind a six-part collection: every scene where Satan appears, he appears inside a boundary God drew."
date: 2026-09-01
author: Dewayne VanHoozer
collection: gods-devil
order: 0
---

Ask anyone to describe the devil and you get a strange composite. A mind that reads yours before you finish forming the thought. A body that can be tempting a stockbroker in Tokyo and a teenager in Ohio at the same hour. A memory of a future he has already watched, long before you get to live it.

Almost none of that comes from the Bible. Most of it comes from horror movies, half-remembered sermons, and a vague sense that the enemy of God must, at some level, be God's equal and opposite.

He is not. And the gap between the borrowed image and the biblical one is not a technicality. It is the difference between a threat you can only run from and a threat you can actually stand against.

Open a Bible instead of a movie screen and a smaller, stranger figure walks out. He tempts, but cannot force a hand he has not already found willing. He roams, but does not occupy two places at once. He schemes, but does not know tomorrow any better than the humans he schemes against. Every scene in Scripture where he appears, he appears inside a boundary God drew first.

> "Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour."
>
> 1 Peter 5:8 (ESV)

That verse gets quoted as a warning, and it is one. It is also, on a closer read, a description of an animal that has to hunt. A lion that could simply help itself would not need to prowl, and it would not need to seek. The verse meant to put a reader on guard ends up conceding, in the same breath, that the guard has real ground to stand on.

That concession runs through the whole Bible, not just one verse. Before Satan can touch anything of Job's, he has to ask, and God draws the line before he leaves the room. Before he can lay a hand on Jesus in the wilderness, the Spirit is the one who put Jesus there. Before he can claim a throne, he has to admit the throne was delivered to him rather than built by him. He is dangerous. He is also, everywhere the text shows him working, on God's leash.

That has a name, and it is a promise, not just an observation.

> "I give them eternal life, and they will never perish, and no one will snatch them out of my hand. My Father, who has given them to me, is greater than all, and no one is able to snatch them out of the Father's hand."
>
> John 10:28-29 (ESV)

The reason the leash matters is not that it makes Satan harmless. He does not need to be harmless for that promise to hold. He needs to be smaller than the hand holding you, and Scripture never once measures him against God's size. It measures him against God's permission.

That still leaves a question. If the leash means Satan was never the real danger, what is? Jesus told His own followers directly, and He did not soften it.

> "And do not fear those who kill the body but cannot kill the soul. Rather fear him who can destroy both soul and body in hell."
>
> Matthew 10:28 (ESV)

The devil, on his best day, reaches only the body, and only as far as his leash allows. He was never a candidate for what that verse describes. The one who can destroy soul and body was always God, not Satan. But that is the same God who promises that nothing snatches you out of His hand. He is the only one with the power to end you completely, and He spent His own Son on a cross to make sure He never would. That is what happens once the fear is aimed correctly. It does not disappear. It comes to rest in the one hand strong enough to hold it.

This collection follows that boundary through six scenes: what the text says he cannot do, what he can only counterfeit, why the sin he offers still has to be your own, how one man in a wilderness argued him down, and why an already-defeated enemy still gets to keep fighting for a while. Fear of Satan usually comes from believing he is bigger than he is. What follows is an attempt to see him at his actual size.

---

<%
  is_production = Bridgetown.environment.to_s == "production"

  posts_by_order = site.resources
    .select  { |r| r.data[:collection].to_s == "gods-devil" }
    .each_with_object({}) { |r, h| h[r.data[:order].to_i] = r }

  parts = [
    { order: 1, label: "Part 1: Devil on a Leash",
      blurb: "Scripture calls him a roaring lion and means it. It also has him asking permission before he touches a single thing that belongs to Job. This essay holds both facts at once, real danger and a real leash, and what that combination means for the fear that keeps a believer up at night." },
    { order: 2, label: "Part 2: Satan is not God",
      blurb: "He is not all-knowing. He is not everywhere. He watched one man's suffering up close and still guessed wrong about how it would end. This essay puts the popular image of Satan next to the biblical one and measures the distance between them." },
    { order: 3, label: "Part 3: Borrowed Power",
      blurb: "Every sign he performs, someone else performed first. Every claim he makes, someone else's language, borrowed without permission. This essay follows his signs back to their source and finds a hard floor underneath the imitation." },
    { order: 4, label: "Part 4: The Devil Did Not Make You Do It",
      blurb: "He entered Judas. He filled Ananias's heart. Read alone, both verses sound like a hostile takeover of the will. Read against what each man had already chosen, they describe something closer to a door held open than a door kicked in." },
    { order: 5, label: "Part 5: How to Argue with the Devil",
      blurb: "He met a man in a wilderness, hungry and alone, and lost three times in a row. This essay reads the exchange move by move and asks what made the losing side so sure of himself, and what made the winning side sure of something else." },
    { order: 6, label: "Part 6: The Ending Is Already Written",
      blurb: "He knows his time is short, because someone told him so before he ever had the chance to find out for himself. This essay closes the collection where the whole story is already headed: a verdict handed down before the war finished being fought." },
  ]
%>

**God's Devil: Collection Contents**

<% parts.each do |part| %>
<%
  post   = posts_by_order[part[:order]]
  locked = is_production && post && post.data[:date] && post.data[:date].to_date > Date.today
%>
<% if locked %>
**<%= part[:label] %>** (coming <%= post.data[:date].strftime("%B %-d") %>)
<% else %>
[<%= part[:label] %>](<%= relative_url post.relative_url %>)
<% end %>
<%= part[:blurb] %>

<% end %>
<%
  first_post   = posts_by_order[1]
  first_locked = is_production && first_post && first_post.data[:date] && first_post.data[:date].to_date > Date.today
%>
<% if first_locked %>
The first essay, *Devil on a Leash*, publishes <%= first_post.data[:date].strftime("%B %-d") %>.
<% else %>
The collection begins with [*Devil on a Leash*](<%= relative_url first_post.relative_url %>).
<% end %>
