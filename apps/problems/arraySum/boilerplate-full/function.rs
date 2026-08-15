
use std::io::{self, Read};

##USER_CODE_HERE##

fn main() {
  let mut input_str = String::new();
  io::stdin().read_to_string(&mut input_str).unwrap();
  let mut input = input_str.split_whitespace();
  let size_arr: usize = input.next().unwrap().parse().unwrap();
  let arr: Vec<i32> = (0..size_arr).map(|_| input.next().unwrap().parse().unwrap()).collect();
  let result = Sum(arr);
  println!("{}", result);
}
    