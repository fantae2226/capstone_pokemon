import LoginSignup from "./LoginSignup"
import { render, screen } from "@testing-library/react"
import {userEvent} from "@testing-library/user-event"



describe('Login Form Test Cases', () => {

    describe('Log In', () => {
        test('Email input field and Password input field exist?', () => {
            render(<LoginSignup />);
            expect(screen.getByLabelText("Email")).toBeInTheDocument();
            expect(screen.getByLabelText("Password")).toBeInTheDocument();
        
        })
    })


    describe('Sign up', () => {




        test('Switching To Sign up and check input field existance', async () => {
            render(<LoginSignup />);
            await userEvent.click(
                screen.getByRole("tab", {
                    name: "Sign Up IconSign Up"
                })
            );

            expect(screen.getByLabelText("Username")).toBeInTheDocument();
            expect(screen.getByLabelText("Email")).toBeInTheDocument();
            expect(screen.getByLabelText("Password")).toBeInTheDocument();

            
        })
    })


})