import UrlPattern from "./src/url-pattern.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const pattern = new UrlPattern("/api/users/:id");

assertEquals(pattern.match("/api/users/5"), {id: "5"});
assertEquals(pattern.stringify({id: 10}), "/api/users/10");
