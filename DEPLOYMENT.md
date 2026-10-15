# Deploying BioPulse SRE Monitor to GitHub Pages & Google Sign-In Setup

This repository is configured to deploy directly to **GitHub Pages** with automated GitHub Actions CI/CD and per-user isolated dashboards.

## 1. How to Enable GitHub Pages (Takes 30 seconds)

1. Open your repository on GitHub:
   [https://github.com/musaraza004/biopulse-sre-monitor](https://github.com/musaraza004/biopulse-sre-monitor)
2. Click **Settings** (top tab of repository).
3. In the left sidebar, click **Pages** (under *Code and automation*).
4. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions** (do NOT choose deploy from branch, select *GitHub Actions*).
5. Push any commit to `main` (or go to the **Actions** tab on GitHub and click *Run workflow*).
6. That is it! Your site will be published at:
   **`https://musaraza004.github.io/biopulse-sre-monitor/`**

---

## 2. How User Sign-In & Per-User Dashboards Work

### Client-Side Isolation Architecture
GitHub Pages is a static host. To ensure **every user has their own independent dashboard**, the application isolates user workspaces using scoped local storage and Google Identity:
- **Active User Scoping**: Probes, incident simulations, alert thresholds, and custom monitors are keyed strictly by user ID (`user_{email}`).
- **Data Isolation**: When **Musa Raza** (`musaraza004@gmail.com`) adds a probe or triggers an incident test, it will **not** show up in another user's dashboard.
- **Account Switcher**: Users can switch accounts or enter any Google email to spawn a fresh, isolated workspace.
- **Backup & Portability**: Users can click **Export Dashboard JSON** to save or transfer their workspace across machines.

### Setting up Production Google OAuth 2.0 (Optional)
To link your Google Cloud OAuth Client ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create or edit an **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized JavaScript origins**, add:
   - `https://musaraza004.github.io`
4. Under **Authorized redirect URIs**, add:
   - `https://musaraza004.github.io/biopulse-sre-monitor/`
5. Save your Client ID.

---

## 3. 100% Free Forever Architecture ($0.00 Total Cost)

This stack is deliberately architected so that **you never have to pay a single dollar** and **no credit card is required**:

| Component | Technology | Free Tier Policy | Cost |
| :--- | :--- | :--- | :--- |
| **Web Hosting** | GitHub Pages | Unlimited traffic for public repositories, free SSL certificate | **$0.00** |
| **CI/CD Pipeline** | GitHub Actions | Unlimited minutes for public open-source repos | **$0.00** |
| **Authentication** | Google Identity (OAuth 2.0) | Standard web client credentials require no billing account | **$0.00** |
| **Storage & State** | Browser LocalStorage + JSON | Stored in the user's browser, 0 cloud database servers | **$0.00** |
| **Application** | BioPulse SRE Monitor | 100% Open Source (Apache-2.0), no subscription, no caps | **$0.00** |

### How Every User Gets Their Own Dashboard for sh
- Because each user's monitors and simulations are kept in their own browser's scoped storage (`user_{email}`), there are no monthly database hosting bills or egress bandwidth fees.
- When Musa logs in, he sees Musa's cluster and custom probes.
- When a teammate logs in on their laptop, they see their own isolated dashboard.
- Users can click **Export Dashboard JSON** at any time to back up or sync their configuration.
