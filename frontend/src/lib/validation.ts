export const validateRequired = (value: any, fieldName: string = 'Field'): string | null => {
    if (value === undefined || value === null || value === '') {
        return `${fieldName} is required`;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return `${fieldName} is required`;
    }
    return null;
};

export const validateEmail = (email: string): string | null => {
    const requiredError = validateRequired(email, 'Email');
    if (requiredError) return requiredError;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Enter a valid email address';
    }
    return null;
};

export const validatePassword = (password: string): string | null => {
    const requiredError = validateRequired(password, 'Password');
    if (requiredError) return requiredError;

    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    return null;
};

export const validateWeights = (weight: any, fieldName: string = 'Weight'): string | null => {
    const num = Number(weight);
    if (isNaN(num)) return `${fieldName} must be a number`;
    if (num < 0 || num > 100) return `${fieldName} must be between 0 and 100`;
    return null;
};

export const validateDate = (date: string, fieldName: string = 'Date'): string | null => {
    const requiredError = validateRequired(date, fieldName);
    if (requiredError) return requiredError;

    const d = new Date(date);
    if (isNaN(d.getTime())) return `Enter a valid ${fieldName}`;
    return null;
};
