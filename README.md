# Sandip Beldare Office System

A local, authenticated office application for complaints, office registers, letters, meetings, tasks and expense insights. Records are stored in a SQLite database (`sandip-office.db`) on the laptop—not in browser storage.

## Run on the laptop

Double-click `Launch Sandip Office System.cmd`. On first launch, create the administrator password. All later launches require that password and serve the app locally at `http://localhost:4173`.

To use it as a desktop-style app, open the page in Edge, use **Apps → Install this site as an app**, then keep the installed app shortcut only on the administrator's Windows account.

## Google Forms responses

Create a Google Form with these questions: Name, Mobile number, Email address, Complaint domain, and Complaint description. In Google Forms, open **Responses → More (⋮) → Download responses (.csv)**. Then use **Import Google Forms CSV** in the Complaint Register screen.

The importer recognises common headings such as name, phone/mobile, email, domain/category, and description/complaint/message.

> Security note: use a password-protected Windows account as well as the application password. The database is local to the laptop. Live Google Forms sync requires authorization to a Google Sheet or Forms API; this must be connected using the owner's Google account before it can be enabled securely.
