# Client brief — placing an order (raw, pre-grill)

> This is the unedited brief exactly as the client sent it. It is deliberately
> vague and mixes WHAT with stray HOW — the `/grill` step turns it into the
> approved `spec.md`. Kept here as provenance so a reviewer can see WHAT was asked
> vs. WHAT was decided.

---

**From:** Priya (founder, Bloomcart)
**To:** dev
**Subject:** checkout / placing an order — the actual money bit

Hi again,

Now that people can have accounts, the big one: let a logged-in customer actually
place their order. This is the bit that makes us money so I care about it most.

Here's roughly how I picture it. They've got a cart with stuff in it (we already
have the cart). They hit "Place order", we take payment, and they get a
confirmation — order number, what they bought, total, the works. They should be
able to see it worked and ideally get an email receipt, though if email is fiddly
we can do that bit later.

A few things I know we need:

- They have to be logged in to order. If somehow they're not, send them to sign up
  / log in and then bring them back to finish — don't just lose the order.
- We need a shipping address. We don't store one yet so they'll have to enter it
  at checkout. Name, address, city, postcode, country — the usual. Maybe save it
  to their account for next time? Nice to have.
- Payment — we'll use Stripe (we already have an account). I don't really know how
  the technical side works, you'll know better than me. Just don't store card
  numbers ourselves, I know that's a compliance nightmare.
- Don't let them order an empty cart, obviously. And if something in the cart went
  out of stock or the price changed since they added it, we can't just charge them
  the wrong amount — handle that gracefully, tell them what happened.
- If the payment fails (card declined, whatever) they should NOT get an order and
  should NOT be charged, and they should be able to try again with a different
  card without re-entering everything.
- Once an order is placed, the cart should empty out so they don't accidentally
  order the same thing twice.

Money stuff has to be exactly right — I will lose sleep if someone gets
double-charged or charged the wrong total, so be paranoid about that. Stock should
go down when an order is placed so we don't oversell.

Out of scope for v1, before you ask: discount codes, gift cards, multiple shipping
options / delivery dates, guest checkout (they must have an account), and order
cancellation/refunds — all later.

This is the demo centerpiece for the board so it needs to actually work, not just
look like it works.

Cheers,
Priya
