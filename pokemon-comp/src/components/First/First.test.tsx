import { First } from "./First";
import {render} from "@testing-library/react"

describe('First Tests', () =>{
    test('Should render component', ()=>{
        render(<First />)
        expect(true).toBeTruthy()
    })
})