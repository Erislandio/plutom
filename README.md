# Plutom Masterdata CLI ![CLI](https://cdn4.iconfinder.com/data/icons/small-n-flat/24/terminal-64.png)

![enter image description here](https://image.flaticon.com/icons/svg/2534/2534297.svg)

## Install

```SH
yarn global add @erislandio/plutom or npm install @erislandio/plutom -g
```

  

## Usage: plutom [options]

  

### Options:

  

```sh
-V, --version output the version number

-lg, --login Login on application

-u, --use Use an account

-i, --info Show account info

-a, --add Add an account

--logout Logout

-ls, --list Lists created accounts

-rm, --remove Remove an account

-dbs, --databases List databases (acronym)

--all <acronym> Get all data from acronym

-q, --query <query> Get all data from acronym - ex: select firstName from CL

-d, --desc <acronym> List info from table ex: --desc 'CL'

-n, --new Create new user

--banner Show banner

-h, --help display help  for  command
```

  
  

### starting

  
* if you are already registered

  

```sh
plutom --login
```

* if you don't have one, just create

  

```sh
plutom --new
```

  

* Adding an account to make queries. You will need `appKey` and `appToken` (rest assured it will not be public)

  

```sh
plutom --add
```

  

### Query example:

* all databases

```SH
    plutom --dbs
```

* select

```sh
    plutom -q "select * from CL where email='user@email.com'"
```

* select filter

```sh
    plutom -q "select firstName, lastName from CL where email='user@email.com'"
```

* desc

```sh
    plutom --desc CL
```

### Exit

```sh
    plutom --logout
```