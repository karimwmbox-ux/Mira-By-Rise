# Instructions Configuration Google

Pour faire fonctionner la connexion Google et la base de données Sheets, suivez ces étapes :

## 1. Google OAuth (Connexion)
1. Accédez à [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un projet.
3. Allez dans **API et services > Écran de consentement OAuth** et configurez-le (Type: Externe).
4. Allez dans **API et services > Identifiants**.
5. Cliquez sur **Créer des identifiants > ID client OAuth** (Type: Application Web).
6. Ajoutez l'URL suivante dans **URI de redirection autorisés** :
   `https://ais-dev-vp4m7n557lktqicqqbe5ao-512956409816.europe-west2.run.app/auth/google/callback`
7. Copiez le **Client ID** et le **Client Secret**.

## 2. Google Sheets (Base de données)
1. Activez la **Google Sheets API** dans la bibliothèque Google Cloud.
2. Créez un **Compte de service** dans la section Identifiants.
3. Générez une **clé JSON** pour ce compte de service.
4. Créez un Google Sheet et **partagez-le** avec l'email du compte de service (en mode Éditeur).
5. Copiez l'ID du Sheet (présent dans l'URL du document).

## 3. Configuration des Secrets
Rendez-vous dans les paramètres (Settings) de l'application ici et ajoutez les variables suivantes :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (Mettez l'URL de redirection citée plus haut)
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (Copiez toute la clé privée incluant les balises BEGIN/END)
