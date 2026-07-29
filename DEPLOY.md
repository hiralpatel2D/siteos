# Getting SiteOS onto a live link you can open anytime

You only need two free accounts: GitHub (to hold the code) and Render (to run it).
Neither needs a credit card. Follow these in order — it takes about 10–15 minutes
the first time.

## Step 1 — Create a GitHub account (skip if you already have one)

1. Go to https://github.com and click **Sign up**.
2. Follow the prompts (email, password, username). Verify your email if asked.

## Step 2 — Put the SiteOS code in a new GitHub repository

1. Once logged in, click the **+** icon (top right) → **New repository**.
2. Name it `siteos` (or anything you like). Leave it set to **Public**. Don't
   check any of the "initialize with README" boxes. Click **Create repository**.
3. On the next page, click **uploading an existing file** (a blue link in the
   middle of the page).
4. Unzip the `siteos-source.zip` file you already have on your computer.
   Drag the **entire contents** of the unzipped `siteos` folder (the
   `backend` folder, `frontend` folder, `render.yaml`, `README.md`, everything
   — not the zip file itself, and not a folder wrapping them) into the
   upload box on that GitHub page.
5. Wait for the upload to finish, then scroll down and click **Commit changes**.

That's it for GitHub — your code now lives at
`https://github.com/<your-username>/siteos`.

## Step 3 — Create a free Render account

1. Go to https://render.com and click **Get Started**.
2. Choose **Sign up with GitHub** — this is the easiest option since it also
   connects the two automatically. Approve the connection when GitHub asks.

## Step 4 — Deploy SiteOS on Render

1. On the Render dashboard, click **New +** → **Blueprint**.
2. Render will ask you to pick a GitHub repository — choose the `siteos`
   repository you just created.
3. Render reads the `render.yaml` file in the repo automatically and shows
   you the service it's about to create (it's already named `siteos`, on the
   free plan). You shouldn't need to change anything.
4. Click **Apply** (or **Create New Resources**).
5. Render will start building and deploying — you'll see live logs. This
   takes a few minutes the first time (it's installing everything and
   building the app).
6. When it finishes, Render shows you a URL like
   `https://siteos-xxxx.onrender.com`. Click it.

## Step 5 — Log in

Use any of these (password is the same for all): **`Admin@123`**

- `superadmin@siteos.app` — Super Admin (full access)
- `admin@siteos.app` — Admin
- `engineer@siteos.app` — Site Engineer (limited access, good for testing permissions)
- `accounts@siteos.app` — Accountant (limited access)

## A couple of things worth knowing

- **The free Render plan "sleeps" the app after about 15 minutes with no
  visitors.** The next time someone opens the link, it takes 30–50 seconds
  to wake back up (you'll just see a loading spinner or blank page briefly)
  — that's normal, not broken. After that it's instant until it goes quiet
  again.
- **The demo data resets on redeploy.** Every time you push new code changes
  and Render rebuilds, the database starts fresh with the same demo projects
  and logins you saw in this first version. Anything typed into the app
  between deploys is safe — it only resets when the app itself is redeployed
  or restarted by Render (which also happens automatically sometimes on the
  free tier after long idle periods). If you want data that survives
  permanently, that's a small upgrade to a paid Render disk later — not
  something you need to worry about while we're still shaping the app.
- **To push updates later**, the easiest path without learning git commands
  is: make the change here in our conversation, I'll give you an updated
  zip, and you repeat Step 2 (upload the changed files over the old ones in
  the same GitHub repository — GitHub will ask "replace these files?", say
  yes). Render redeploys automatically within a minute or two of the GitHub
  repo changing.

If anything on Render's side looks different from these steps (they do
update their UI occasionally), tell me what you're seeing and I'll help you
find the right button.
