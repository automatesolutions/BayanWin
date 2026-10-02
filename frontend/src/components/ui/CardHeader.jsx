import React from 'react';

/** Title row used by every dashboard card: icon + title, optional description and actions. */
const CardHeader = ({ icon: Icon, title, description, actions, as: Tag = 'h2' }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0 space-y-1">
      <Tag className="card-title">
        {Icon && <Icon aria-hidden />}
        {title}
      </Tag>
      {description && <p className="max-w-prose text-sm leading-relaxed text-silver-400">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default CardHeader;
