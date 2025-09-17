// Utility function to format structured address into display string
export const formatAddress = (addressData: {
  street?: string;
  number?: string; 
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}): string => {
  const parts: string[] = [];
  
  // Build address line (street + number + complement)
  if (addressData.street) {
    let addressLine = addressData.street;
    if (addressData.number) {
      addressLine += `, ${addressData.number}`;
    }
    if (addressData.complement) {
      addressLine += ` - ${addressData.complement}`;
    }
    parts.push(addressLine);
  }
  
  // Add neighborhood
  if (addressData.neighborhood) {
    parts.push(addressData.neighborhood);
  }
  
  // Add city and state
  if (addressData.city) {
    let cityState = addressData.city;
    if (addressData.state) {
      cityState += ` - ${addressData.state}`;
    }
    parts.push(cityState);
  }
  
  // Add postal code if available
  if (addressData.postal_code) {
    parts.push(`CEP: ${addressData.postal_code}`);
  }
  
  return parts.length > 0 ? parts.join(', ') : '';
};

// Helper to convert form data to database format for events
export const formatEventAddressForDB = (formData: {
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string; // camelCase from form
}) => {
  // Also generate a formatted string for backward compatibility
  const formattedAddress = formatAddress({
    street: formData.address,
    number: formData.number,
    complement: formData.complement,
    neighborhood: formData.neighborhood,
    city: formData.city,
    state: formData.state,
    postal_code: formData.postalCode,
  });
  
  return {
    street: formData.address,
    number: formData.number,
    complement: formData.complement,
    neighborhood: formData.neighborhood,
    city: formData.city,
    state: formData.state,
    postal_code: formData.postalCode,
    location_address: formattedAddress, // Keep for backward compatibility
  };
};