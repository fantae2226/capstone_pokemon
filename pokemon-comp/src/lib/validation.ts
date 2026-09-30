const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

//each function returns an error message, or '' if the value is fine

export function validateEmail(email: string): string {
    return emailRegex.test(email) ? '' : 'Please enter a valid email address.';
}

export function validatePassword(password: string): string {
    return passwordRegex.test(password) ? '' : 'Password must have minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character.';
}