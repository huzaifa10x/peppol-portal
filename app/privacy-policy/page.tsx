import React from 'react'

export default function Privacy() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6 text-gray-800 leading-relaxed">
      <h1 className="text-4xl font-bold text-[#7C01ED]">Privacy Policy</h1>
      {/* <p className="text-sm text-gray-500 font-medium">Effective Date: [Insert Date]</p>
      <p className="text-sm text-gray-500 font-medium">Last Updated: [Insert Date]</p> */}

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">1. Introduction</h2>
      <p>KASA Advisory Services FZE KASA respects your privacy and is committed to protecting the confidentiality, integrity, and security of personal information and business information processed through our services.</p>
      <p>KASA operates a cloud-based Software-as-a-Service (SaaS) electronic invoicing platform that enables businesses to create, validate, exchange, receive, monitor, and manage structured electronic invoices through the OpenPeppol network and related electronic document exchange services. The Platform also provides secure REST APIs, web-based portals, integration services, validation engines, monitoring capabilities, reporting functions, and other supporting services.</p>
      <p>This Privacy Policy explains how we collect, use, disclose, store, retain, and protect information when individuals or organizations use our Platform, websites, APIs, customer portals, developer portals, integration services, or otherwise interact with KASA.</p>
      <p>By using our Platform or Services, you acknowledge that you have read and understood this Privacy Policy.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">2. Scope</h2>
      <p>This Privacy Policy applies to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>KASA Customer Portal</li>
        <li>Administrative Portal</li>
        <li>REST APIs</li>
        <li>Developer Portal</li>
        <li>Sandbox Environment</li>
        <li>Production Environment</li>
        <li>Integration Services</li>
        <li>Customer Support</li>
        <li>Website</li>
        <li>OpenPeppol Services</li>
        <li>Access Point Services</li>
        <li>Service Metadata Publisher (SMP)</li>
        <li>Invoice Validation Services</li>
        <li>Tax Data Document (TDD) Services</li>
        <li>Any additional electronic invoicing services operated by KASA</li>
      </ul>
      <p>This Privacy Policy applies to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Customers</li>
        <li>Customer employees</li>
        <li>Authorized users</li>
        <li>API consumers</li>
        <li>Developers</li>
        <li>Integration partners</li>
        <li>Website visitors</li>
        <li>Prospective customers</li>
        <li>Business representatives</li>
      </ul>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">3. Definitions</h2>
      <p>For purposes of this Privacy Policy:</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Account</h3>
      <p>A registered account used to access the Platform.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">API</h3>
      <p>Application Programming Interface published by KASA to facilitate secure integration with external systems.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Business Information</h3>
      <p>Information relating to a company or organization, including registration details, tax identifiers, contact information, and business configuration.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Customer</h3>
      <p>Any legal entity using the Platform under a subscription or service agreement.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Customer Data</h3>
      <p>All information submitted, uploaded, transmitted, or otherwise processed through the Platform by or on behalf of a Customer.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Invoice Data</h3>
      <p>Electronic invoices, credit notes, debit notes, attachments, metadata, purchase orders, and related business documents processed by the Platform.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">OpenPeppol</h3>
      <p>The international interoperability framework that enables secure exchange of electronic business documents between participating organizations.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Personal Information</h3>
      <p>Information relating to an identified or identifiable natural person.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Platform</h3>
      <p>The cloud-based electronic invoicing solution operated by KASA.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Processing</h3>
      <p>Any operation performed on information, including collection, storage, transmission, validation, modification, disclosure, deletion, or destruction.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Services</h3>
      <p>All services provided by KASA including software, APIs, integrations, support, validation, routing, monitoring, reporting, and related offerings.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">User</h3>
      <p>An individual authorized by a Customer to access the Platform.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">4. Information We Collect</h2>
      <p>The information we collect depends on how you interact with our Platform and Services.</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.1 Business Information</h3>
      <p>We may collect:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Company name</li>
        <li>Legal entity name</li>
        <li>Trade licence details</li>
        <li>VAT Registration Number (TRN)</li>
        <li>Business address</li>
        <li>Billing information</li>
        <li>Authorized representatives</li>
        <li>Contact information</li>
        <li>Peppol Participant Identifier</li>
        <li>Business configuration</li>
        <li>Subscription details</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.2 User Information</h3>
      <p>We may collect:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Full name</li>
        <li>Business email address</li>
        <li>Telephone number</li>
        <li>Job title</li>
        <li>Department</li>
        <li>Username</li>
        <li>User preferences</li>
        <li>Language preferences</li>
        <li>Time zone</li>
        <li>Account status</li>
        <li>Login history</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.3 Authentication Information</h3>
      <p>To secure our Platform, we may process:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Password hashes</li>
        <li>Multi-factor authentication configuration</li>
        <li>Authentication tokens</li>
        <li>OAuth credentials</li>
        <li>JWT tokens</li>
        <li>Session identifiers</li>
        <li>API keys</li>
        <li>Security events</li>
      </ul>
      <p>KASA does not store user passwords in plaintext.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.4 Invoice Information</h3>
      <p>The Platform processes electronic business documents submitted by Customers, including:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Invoice number</li>
        <li>Invoice date</li>
        <li>Supplier information</li>
        <li>Buyer information</li>
        <li>Tax registration numbers</li>
        <li>Invoice line items</li>
        <li>Product descriptions</li>
        <li>Quantities</li>
        <li>Unit prices</li>
        <li>VAT information</li>
        <li>Currency</li>
        <li>Payment terms</li>
        <li>Delivery references</li>
        <li>Purchase order references</li>
        <li>Credit notes</li>
        <li>Debit notes</li>
        <li>Supporting attachments</li>
      </ul>
      <p>Invoice data is processed solely for providing contracted Platform services and complying with applicable legal and regulatory requirements.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.5 API Usage Information</h3>
      <p>When APIs are used, we may collect:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>API endpoint</li>
        <li>Request timestamp</li>
        <li>Response timestamp</li>
        <li>Request identifier</li>
        <li>Correlation identifier</li>
        <li>Tenant identifier</li>
        <li>API version</li>
        <li>Authentication method</li>
        <li>Client application</li>
        <li>IP address</li>
        <li>Response code</li>
        <li>Processing duration</li>
        <li>Error details</li>
      </ul>
      <p>This information is used to operate the Platform, troubleshoot issues, monitor performance, maintain security, and improve service reliability.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.6 Technical Information</h3>
      <p>We automatically collect certain technical information, including:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Browser type</li>
        <li>Operating system</li>
        <li>Device information</li>
        <li>IP address</li>
        <li>Device identifiers</li>
        <li>Session identifiers</li>
        <li>Language settings</li>
        <li>Access logs</li>
        <li>Diagnostic information</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">4.7 Audit Information</h3>
      <p>To support security, compliance, and operational integrity, KASA records audit information including:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>User logins</li>
        <li>User activities</li>
        <li>Administrative actions</li>
        <li>Invoice processing events</li>
        <li>Configuration changes</li>
        <li>API activity</li>
        <li>Validation events</li>
        <li>Security alerts</li>
        <li>System administration events</li>
      </ul>
      <p>Audit logs are maintained to support security monitoring, troubleshooting, operational accountability, and compliance with applicable legal obligations.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">5. How We Use Information</h2>
      <p>KASA processes information for legitimate business purposes, including:</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Platform Operations</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Creating customer accounts</li>
        <li>Managing subscriptions</li>
        <li>Providing access to the Platform</li>
        <li>Authenticating users</li>
        <li>Managing tenants</li>
        <li>Administering customer environments</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Electronic Invoicing Services</h3>
      <p>Information is processed to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Receive invoices</li>
        <li>Validate invoice structure</li>
        <li>Apply business validation rules</li>
        <li>Convert supported document formats</li>
        <li>Route invoices through the OpenPeppol network</li>
        <li>Deliver invoices to recipients</li>
        <li>Track processing status</li>
        <li>Generate Tax Data Documents (TDDs), where applicable</li>
        <li>Support regulatory reporting workflows</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">API Services</h3>
      <p>We process information to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Authenticate API clients</li>
        <li>Process API requests</li>
        <li>Enforce authorization controls</li>
        <li>Prevent duplicate submissions</li>
        <li>Monitor API performance</li>
        <li>Maintain service availability</li>
        <li>Improve API functionality</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Customer Support</h3>
      <p>Information is processed to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Respond to enquiries</li>
        <li>Investigate issues</li>
        <li>Resolve incidents</li>
        <li>Provide technical assistance</li>
        <li>Improve customer experience</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Security</h3>
      <p>We use information to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Detect unauthorized access</li>
        <li>Prevent fraud</li>
        <li>Monitor threats</li>
        <li>Investigate security incidents</li>
        <li>Maintain audit logs</li>
        <li>Protect customer environments</li>
        <li>Ensure platform integrity</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Compliance</h3>
      <p>Information may be processed to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Meet contractual obligations</li>
        <li>Comply with applicable laws</li>
        <li>Respond to lawful requests from competent authorities</li>
        <li>Support regulatory reporting</li>
        <li>Maintain audit records</li>
        <li>Demonstrate compliance during assessments or audits</li>
      </ul>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">6. Legal Basis for Processing</h2>
      <p>Where applicable, KASA processes personal information on one or more of the following legal bases:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Performance of a contract with the Customer.</li>
        <li>Compliance with applicable legal and regulatory obligations.</li>
        <li>Legitimate interests in operating, securing, and improving the Platform.</li>
        <li>Consent, where consent is required by applicable law.</li>
      </ul>
      <p>Where processing is based on consent, consent may be withdrawn at any time. Withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">7. Disclosure and Sharing of Information</h2>
      <p>KASA recognizes that Customer Data and Personal Information are confidential and are processed solely for the purposes described in this Privacy Policy or as required by applicable law.</p>
      <p>KASA does not sell, rent, or trade Customer Data or Personal Information to third parties for advertising or marketing purposes.</p>
      <p>Information may be shared only in the following circumstances.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">7.1 Trading Partners</h3>
      <p>Where a Customer exchanges electronic business documents through the Platform, invoice information may be transmitted to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Customers' designated trading partners</li>
        <li>Buyers</li>
        <li>Suppliers</li>
        <li>Service providers participating in document exchange</li>
        <li>OpenPeppol participants</li>
      </ul>
      <p>Such disclosure is necessary to complete the requested electronic document exchange.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">7.2 OpenPeppol Network</h3>
      <p>Where electronic documents are exchanged through the OpenPeppol Network, KASA may transmit information necessary for secure document delivery, participant discovery, message routing, and receipt confirmation.</p>
      <p>Information exchanged through OpenPeppol is limited to information required for successful business document exchange and compliance with applicable OpenPeppol specifications.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">7.3 Government Authorities</h3>
      <p>KASA may disclose information where required by applicable law or lawful request from competent authorities.</p>
      <p>This may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Courts</li>
        <li>Regulatory authorities</li>
        <li>Tax authorities</li>
        <li>Government agencies</li>
        <li>Law enforcement agencies</li>
      </ul>
      <p>Such disclosure will only occur where legally required or legally permitted.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">7.4 Technology Service Providers</h3>
      <p>KASA uses carefully selected third-party service providers to operate portions of the Platform.</p>
      <p>These providers may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Cloud infrastructure providers</li>
        <li>Monitoring providers</li>
        <li>Security service providers</li>
        <li>Email delivery providers</li>
        <li>Backup providers</li>
        <li>Disaster recovery providers</li>
        <li>Technical support providers</li>
      </ul>
      <p>These providers are contractually obligated to maintain appropriate confidentiality and security safeguards.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">7.5 Professional Advisers</h3>
      <p>Information may be shared with:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Legal advisers</li>
        <li>External auditors</li>
        <li>Accountants</li>
        <li>Insurance providers</li>
        <li>Professional consultants</li>
      </ul>
      <p>where necessary for legitimate business purposes.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">7.6 Corporate Transactions</h3>
      <p>If KASA undergoes:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>merger</li>
        <li>acquisition</li>
        <li>restructuring</li>
        <li>financing</li>
        <li>sale of assets</li>
      </ul>
      <p>information may be transferred as part of that transaction, subject to applicable legal requirements.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">8. OpenPeppol Services</h2>
      <p>The Platform enables electronic business document exchange using the OpenPeppol interoperability framework.</p>
      <p>When Customers choose to exchange documents using OpenPeppol:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>participant identifiers may be processed</li>
        <li>routing metadata may be processed</li>
        <li>document transmission information may be processed</li>
        <li>delivery evidence may be generated</li>
        <li>message acknowledgements may be stored</li>
      </ul>
      <p>KASA processes this information solely for operating electronic document exchange services.</p>
      <p>KASA is not responsible for the privacy practices of independent trading partners or third-party Access Points beyond KASA's operational control.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">9. Regulatory Reporting</h2>
      <p>Where applicable, the Platform supports electronic invoicing regulatory reporting obligations.</p>
      <p>To provide these services, KASA may process:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>tax information</li>
        <li>invoice metadata</li>
        <li>document identifiers</li>
        <li>reporting identifiers</li>
        <li>transmission timestamps</li>
        <li>regulatory acknowledgements</li>
      </ul>
      <p>Where legally required, such information may be transmitted to competent governmental authorities using approved technical interfaces.</p>
      <p>KASA processes such information solely for compliance with applicable regulatory obligations.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">10. International Data Transfers</h2>
      <p>KASA primarily stores Customer information within approved cloud environments selected for the Platform.</p>
      <p>Where information is transferred outside the country in which it was originally collected, KASA implements appropriate safeguards including:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>contractual protections</li>
        <li>encryption</li>
        <li>secure communications</li>
        <li>access controls</li>
        <li>organizational safeguards</li>
      </ul>
      <p>International transfers are performed only where necessary to provide the Services or comply with applicable legal obligations.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">11. Data Storage</h2>
      <p>Customer information is stored using secure cloud infrastructure designed to provide confidentiality, integrity, and availability.</p>
      <p>Security measures include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>encrypted storage</li>
        <li>secure backups</li>
        <li>redundancy</li>
        <li>disaster recovery capabilities</li>
        <li>role-based access controls</li>
        <li>audit logging</li>
        <li>infrastructure monitoring</li>
      </ul>
      <p>KASA regularly reviews storage practices to maintain appropriate security standards.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">12. Information Security</h2>
      <p>Protecting Customer information is a core responsibility of KASA.</p>
      <p>The Platform incorporates administrative, technical, and physical safeguards designed to reduce the risk of unauthorized access, disclosure, alteration, or destruction of information.</p>
      <p>These safeguards include, where appropriate:</p>
      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Identity and Access Management</h3>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Multi-Factor Authentication (MFA)</li>
        <li>Role-Based Access Control (RBAC)</li>
        <li>Least privilege principles</li>
        <li>Session management</li>
        <li>Secure authentication</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Encryption</h3>
      <p>Information is protected using encryption technologies during transmission and, where appropriate, while stored.</p>
      <p>Encryption controls are designed to protect information against unauthorized disclosure.</p>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Network Security</h3>
      <p>Security measures may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>firewalls</li>
        <li>intrusion detection</li>
        <li>network segmentation</li>
        <li>secure communication protocols</li>
        <li>traffic monitoring</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Monitoring</h3>
      <p>The Platform continuously monitors operational and security events.</p>
      <p>Monitoring activities may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>authentication events</li>
        <li>failed login attempts</li>
        <li>administrative actions</li>
        <li>API activity</li>
        <li>infrastructure events</li>
        <li>suspicious activity</li>
        <li>service availability</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Vulnerability Management</h3>
      <p>KASA regularly reviews the Platform for security weaknesses.</p>
      <p>Activities may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>vulnerability assessments</li>
        <li>security updates</li>
        <li>software patching</li>
        <li>infrastructure maintenance</li>
        <li>configuration reviews</li>
      </ul>

      <h3 className="text-xl font-semibold text-[#7C01ED] mt-4">Incident Response</h3>
      <p>KASA maintains procedures for identifying, investigating, responding to, and recovering from security incidents.</p>
      <p>Where required by applicable law or contractual obligations, affected Customers may be notified of significant security incidents.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">13. Customer Responsibilities</h2>
      <p>Customers also play an important role in protecting information.</p>
      <p>Customers are responsible for:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>maintaining accurate account information</li>
        <li>protecting passwords</li>
        <li>securing API credentials</li>
        <li>enabling Multi-Factor Authentication where available</li>
        <li>restricting access to authorized personnel</li>
        <li>protecting their internal systems</li>
        <li>notifying KASA of suspected unauthorized access</li>
        <li>maintaining endpoint security</li>
      </ul>
      <p>Customers remain responsible for the security of their own ERP systems, accounting software, networks, and devices.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">14. Data Retention</h2>
      <p>KASA retains information only for as long as necessary to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>provide Services</li>
        <li>comply with applicable legal obligations</li>
        <li>resolve disputes</li>
        <li>enforce contractual rights</li>
        <li>maintain audit trails</li>
        <li>support regulatory compliance</li>
        <li>investigate security incidents</li>
      </ul>
      <p>Retention periods vary depending on the type of information being processed.</p>
      <p>Examples include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>customer account information</li>
        <li>invoices</li>
        <li>audit logs</li>
        <li>API logs</li>
        <li>authentication records</li>
        <li>security logs</li>
        <li>support records</li>
      </ul>
      <p>Where legally permissible, information that is no longer required will be securely deleted, anonymized, or destroyed using appropriate methods.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">15. Backup and Business Continuity</h2>
      <p>To protect Customer information against accidental loss, corruption, or service interruption, KASA maintains backup and recovery processes.</p>
      <p>Backups may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>application data</li>
        <li>databases</li>
        <li>configuration information</li>
        <li>audit records</li>
        <li>system metadata</li>
      </ul>
      <p>Backups are protected using appropriate security controls and are retained in accordance with KASA's operational and regulatory requirements.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">16. Your Privacy Rights</h2>
      <p>Subject to applicable law, you may have certain rights regarding your Personal Information.</p>
      <p>These rights may include the ability to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Request access to Personal Information held by KASA.</li>
        <li>Request correction of inaccurate or incomplete information.</li>
        <li>Request deletion of Personal Information where legally permissible.</li>
        <li>Request restriction of certain processing activities.</li>
        <li>Object to processing based on legitimate interests where applicable.</li>
        <li>Request portability of Personal Information where technically feasible and legally required.</li>
        <li>Withdraw consent where processing is based on consent.</li>
        <li>Lodge a complaint with an appropriate supervisory authority where permitted by applicable law.</li>
      </ul>
      <p>Certain rights may be limited where KASA is legally required to retain information for regulatory, tax, contractual, fraud prevention, security, or audit purposes.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">17. Exercising Your Rights</h2>
      <p>Requests relating to privacy or Personal Information may be submitted using the contact details provided in this Privacy Policy.</p>
      <p>To protect Customers and users, KASA may request additional information to verify the identity of the requesting individual before fulfilling any request.</p>
      <p>KASA will respond within the timeframes required by applicable law.</p>
      <p>Where a request cannot be fulfilled due to legal or contractual obligations, KASA will explain the reason, where legally permitted.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">18. Customer Data Ownership</h2>
      <p>Customers retain all ownership rights, title, and interest in the Customer Data submitted to or processed through the Platform.</p>
      <p>Except as necessary to provide the Services or comply with applicable law, KASA does not acquire ownership of Customer Data.</p>
      <p>KASA processes Customer Data only:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>to provide contracted Services;</li>
        <li>to maintain the Platform;</li>
        <li>to provide customer support;</li>
        <li>to comply with applicable legal and regulatory obligations; or</li>
        <li>as otherwise instructed by the Customer where permitted by law.</li>
      </ul>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">19. Confidentiality</h2>
      <p>KASA treats Customer information as confidential.</p>
      <p>Employees, contractors, consultants, and authorized service providers are granted access only where necessary to perform their authorized responsibilities.</p>
      <p>All personnel with access to Customer information are expected to comply with applicable confidentiality obligations and information security policies.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">20. Cookies and Similar Technologies</h2>
      <p>KASA's website and web applications may use cookies and similar technologies to improve functionality, maintain secure sessions, and enhance the user experience.</p>
      <p>Cookies may be used for:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>user authentication;</li>
        <li>maintaining active sessions;</li>
        <li>remembering user preferences;</li>
        <li>website performance;</li>
        <li>analytics;</li>
        <li>fraud prevention;</li>
        <li>security monitoring.</li>
      </ul>
      <p>Where required by applicable law, users may manage or withdraw cookie preferences through browser settings or available cookie management tools.</p>
      <p>Disabling certain cookies may affect the functionality of portions of the Platform or website.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">21. Third-Party Services</h2>
      <p>The Platform may integrate with or rely upon third-party products or services, including:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Enterprise Resource Planning (ERP) systems;</li>
        <li>accounting software;</li>
        <li>identity providers;</li>
        <li>cloud infrastructure services;</li>
        <li>email delivery services;</li>
        <li>monitoring and logging services;</li>
        <li>payment providers (where applicable);</li>
        <li>OpenPeppol participants and infrastructure.</li>
      </ul>
      <p>These third parties operate under their own terms and privacy policies. KASA is not responsible for the privacy practices of third-party organizations that operate independently of KASA.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">22. Third-Party Websites</h2>
      <p>The KASA website may contain links to external websites operated by third parties.</p>
      <p>These websites are not controlled by KASA.</p>
      <p>Users are encouraged to review the privacy policies of any third-party websites they visit.</p>
      <p>KASA accepts no responsibility for the privacy practices or content of external websites.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">23. Children's Privacy</h2>
      <p>The Platform is designed exclusively for business and professional use.</p>
      <p>KASA does not knowingly collect Personal Information from children.</p>
      <p>If KASA becomes aware that Personal Information has been collected from a child in violation of applicable law, appropriate steps will be taken to delete such information unless retention is required by law.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">24. Automated Processing</h2>
      <p>Certain Platform functions may automatically process information to:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>validate electronic invoices;</li>
        <li>verify document structure;</li>
        <li>apply business rules;</li>
        <li>detect duplicate submissions;</li>
        <li>identify processing errors;</li>
        <li>route documents;</li>
        <li>monitor platform health;</li>
        <li>detect security events.</li>
      </ul>
      <p>These automated processes support the operation of the Platform and are not intended to make decisions producing legal effects on individuals without appropriate human oversight where required by law.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">25. Data Accuracy</h2>
      <p>Customers are responsible for ensuring that information submitted to the Platform is accurate, complete, and up to date.</p>
      <p>KASA is not responsible for inaccuracies originating from Customer systems, integrations, or manually entered information.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">26. Availability of Services</h2>
      <p>While KASA implements commercially reasonable measures to maintain Platform availability, uninterrupted or error-free operation cannot be guaranteed.</p>
      <p>Scheduled maintenance, emergency maintenance, upgrades, third-party service interruptions, telecommunications failures, force majeure events, or circumstances beyond KASA's reasonable control may temporarily affect service availability.</p>
      <p>Where practicable, Customers will be informed of planned maintenance activities.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">27. Security Incident Notifications</h2>
      <p>If KASA becomes aware of a confirmed security incident affecting Customer information, KASA will respond in accordance with its incident response procedures.</p>
      <p>Where required by applicable law or contractual obligations, KASA will notify affected Customers without undue delay after confirming the incident and assessing its impact.</p>
      <p>Notifications may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>a description of the incident;</li>
        <li>categories of affected information;</li>
        <li>actions taken by KASA;</li>
        <li>recommended actions for Customers;</li>
        <li>available support channels.</li>
      </ul>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">28. Regulatory Compliance</h2>
      <p>The Platform is designed to support electronic invoicing and related compliance requirements.</p>
      <p>However, Customers remain solely responsible for:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>the accuracy of invoice content;</li>
        <li>tax calculations;</li>
        <li>compliance with applicable tax laws;</li>
        <li>business decisions;</li>
        <li>accounting records;</li>
        <li>statutory filings;</li>
        <li>regulatory obligations applicable to their organization.</li>
      </ul>
      <p>Use of the Platform does not constitute legal, accounting, or tax advice.</p>
      <p>Customers should consult qualified legal, accounting, or tax professionals regarding their specific obligations.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">29. Changes to this Privacy Policy</h2>
      <p>KASA may update this Privacy Policy periodically to reflect:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>changes in applicable law;</li>
        <li>regulatory developments;</li>
        <li>new Platform features;</li>
        <li>security improvements;</li>
        <li>operational changes;</li>
        <li>business requirements.</li>
      </ul>
      <p>The revised version will be published on the KASA website with an updated "Last Updated" date.</p>
      <p>Where required by law or contract, Customers will be notified of material changes using appropriate communication channels.</p>
      <p>Continued use of the Platform following publication of an updated Privacy Policy constitutes acknowledgment of the revised Policy unless applicable law requires additional consent.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">30. Contact Information</h2>
      <p>Questions regarding this Privacy Policy or KASA's privacy practices may be directed to:</p>
      <p className="bg-gray-50 p-4 rounded-md border border-gray-200">
        KASA Advisory Services FZE<br />
        Privacy Officer<br />
        Email: privacy@kasaadvisory.com
      </p>
      <p>
        General Enquiries:<br />
        Email: info@kasaadvisory.com<br />
        Website:<br />
        https://www.kasaadvisory.com (replace with your official website if different)
      </p>
      <p>If you believe your privacy rights have been violated, please contact us so we can investigate and respond appropriately.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">31. Governing Law</h2>
      <p>This Privacy Policy shall be governed by and interpreted in accordance with the laws applicable to KASA Advisory Services FZE and any mandatory legal requirements applicable to the processing of Personal Information.</p>
      <p>Nothing in this Privacy Policy limits any statutory rights available to individuals under applicable law.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">32. Severability</h2>
      <p>If any provision of this Privacy Policy is found to be invalid, illegal, or unenforceable by a court or competent authority, the remaining provisions shall continue in full force and effect.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">33. Entire Privacy Policy</h2>
      <p>This Privacy Policy constitutes the entire privacy notice relating to the processing of Personal Information by KASA through the Platform and supersedes previous versions of the Privacy Policy to the extent permitted by law.</p>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">Schedule A – Categories of Information Processed</h2>
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse border border-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-4 py-2 font-semibold">Category</th>
              <th className="border border-gray-200 px-4 py-2 font-semibold">Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Business Information</td>
              <td className="border border-gray-200 px-4 py-2">Company name, trade licence, TRN, registered address</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">User Information</td>
              <td className="border border-gray-200 px-4 py-2">Name, email, phone number, job title</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Authentication Data</td>
              <td className="border border-gray-200 px-4 py-2">Password hashes, MFA configuration, JWT tokens, API keys</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Invoice Data</td>
              <td className="border border-gray-200 px-4 py-2">Invoice numbers, buyer/supplier details, line items, VAT amounts</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Integration Data</td>
              <td className="border border-gray-200 px-4 py-2">ERP identifiers, API requests, webhooks, configuration</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Technical Data</td>
              <td className="border border-gray-200 px-4 py-2">IP address, browser, operating system, device information</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Audit Logs</td>
              <td className="border border-gray-200 px-4 py-2">Login history, administrative actions, processing events</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Security Logs</td>
              <td className="border border-gray-200 px-4 py-2">Authentication failures, access logs, monitoring events</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Support Information</td>
              <td className="border border-gray-200 px-4 py-2">Support requests, communications, troubleshooting records</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-bold text-[#7C01ED] mt-8">Schedule B – Security Controls (Summary)</h2>
      <p>KASA maintains administrative, technical, and organizational security measures appropriate to the nature of the services provided. Depending on the deployed environment and service configuration, these measures may include:</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>Multi-Factor Authentication (MFA)</li>
        <li>Role-Based Access Control (RBAC)</li>
        <li>Encryption in transit using TLS</li>
        <li>Encryption of data at rest</li>
        <li>Audit logging</li>
        <li>Security monitoring</li>
        <li>Vulnerability management</li>
        <li>Backup and recovery procedures</li>
        <li>Change management</li>
        <li>Secure software development practices</li>
        <li>Incident response procedures</li>
        <li>Business continuity planning</li>
      </ul>
    </div>
  )
}