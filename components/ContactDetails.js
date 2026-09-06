import { buildTelHref, isConfiguredContact } from '@/lib/contact.mjs';

export default function ContactDetails({ contacts }) {
  return (
    <div className="contactGrid">
      {contacts.map((contact) => {
        const configured = isConfiguredContact(contact);
        return (
          <article className="contactCard" key={contact.role}>
            <span className="miniOrnament" aria-hidden="true">✦</span>
            <p className="label">{contact.role}</p>
            <h3>{contact.name}</h3>
            {configured ? (
              <a href={buildTelHref(contact.phone)}>{contact.phone}</a>
            ) : (
              <p className="muted">{contact.phone}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
