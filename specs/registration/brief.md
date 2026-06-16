# Client brief — user registration (raw, pre-grill)

> This is the unedited brief exactly as the client sent it. It is deliberately
> vague and mixes WHAT with stray HOW — the `/grill` step turns it into the
> approved `spec.md`. Kept here as provenance so a reviewer can see WHAT was asked
> vs. WHAT was decided.

---

**From:** Priya (founder, Bloomcart)
**To:** dev
**Subject:** sign up before checkout — can we get this in?

Hey,

Following up from our call. We're losing people at checkout because there's no
account — they add stuff to the cart and then bounce when we ask for details. Can
we add a proper sign up?

Keep it dead simple for now: just email + password, that's it. We don't need
names or phone numbers yet, we can ask for that later when they actually order.
Obviously it needs to be secure — we're storing passwords so I don't want that
coming back to bite us. And it can't let the same person sign up twice with the
same email, that's caused duplicate-customer messes in our old system.

When they sign up successfully just log them straight in and drop them back into
the app so they can carry on — no "check your email to confirm" step, that always
kills conversion. We can add email verification down the line maybe.

If something goes wrong they should get a clear message, not just a red box that
says "Error." My non-technical brain wants it to feel friendly. Password rules
should be sensible — strong enough to be safe but I don't want those insane "1
uppercase, 1 symbol, 1 hieroglyph" rules that make people rage quit.

Social login (Google etc.) would be lovely eventually but not now. Same with
forgot-password — later.

Can you give me a sense of timing? Want to demo this to the board in a couple
weeks.

Thanks!
Priya
