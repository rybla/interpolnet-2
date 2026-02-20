
// --- 1. Lexer & Parser ---

class Token {
    constructor(type, value, pos) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }
}

const TokenType = {
    LAMBDA: 'LAMBDA',
    DOT: 'DOT',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    EQUALS: 'EQUALS',
    LET: 'LET',
    IN: 'IN',
    IDENT: 'IDENT',
    INT: 'INT',
    BOOL: 'BOOL',
    EOF: 'EOF'
};

function lex(input) {
    const tokens = [];
    let i = 0;

    while (i < input.length) {
        const char = input[i];

        if (/\s/.test(char)) {
            i++;
        } else if (char === '\\' || char === 'λ') {
            tokens.push(new Token(TokenType.LAMBDA, char, i));
            i++;
        } else if (char === '.') {
            tokens.push(new Token(TokenType.DOT, char, i));
            i++;
        } else if (char === '(') {
            tokens.push(new Token(TokenType.LPAREN, char, i));
            i++;
        } else if (char === ')') {
            tokens.push(new Token(TokenType.RPAREN, char, i));
            i++;
        } else if (char === '=') {
            tokens.push(new Token(TokenType.EQUALS, char, i));
            i++;
        } else if (/[0-9]/.test(char)) {
            const match = input.substring(i).match(/^[0-9]+/)[0];
            tokens.push(new Token(TokenType.INT, parseInt(match, 10), i));
            i += match.length;
        } else if (/[a-zA-Z_][a-zA-Z0-9_]*/.test(input.substring(i))) {
            const match = input.substring(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)[0];
            if (match === 'let') {
                tokens.push(new Token(TokenType.LET, match, i));
            } else if (match === 'in') {
                tokens.push(new Token(TokenType.IN, match, i));
            } else if (match === 'lambda') {
                 tokens.push(new Token(TokenType.LAMBDA, match, i));
            } else if (match === 'true') {
                 tokens.push(new Token(TokenType.BOOL, true, i));
            } else if (match === 'false') {
                 tokens.push(new Token(TokenType.BOOL, false, i));
            } else {
                tokens.push(new Token(TokenType.IDENT, match, i));
            }
            i += match.length;
        } else {
            throw new Error(`Unexpected character '${char}' at position ${i}`);
        }
    }
    tokens.push(new Token(TokenType.EOF, '', i));
    return tokens;
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() {
        return this.tokens[this.pos];
    }

    consume() {
        return this.tokens[this.pos++];
    }

    match(type) {
        if (this.peek().type === type) {
            return this.consume();
        }
        return null;
    }

    expect(type) {
        const token = this.match(type);
        if (!token) {
            throw new Error(`Expected ${type} but found ${this.peek().type} at ${this.peek().pos}`);
        }
        return token;
    }

    parse() {
        const ast = this.parseTerm();
        if (this.peek().type !== TokenType.EOF) {
             throw new Error(`Unexpected token ${this.peek().type} at ${this.peek().pos}`);
        }
        return ast;
    }

    parseTerm() {
        if (this.match(TokenType.LET)) {
            const name = this.expect(TokenType.IDENT).value;
            this.expect(TokenType.EQUALS);
            const value = this.parseTerm();
            this.expect(TokenType.IN);
            const body = this.parseTerm();
            return { type: 'Let', name, value, body };
        } else if (this.match(TokenType.LAMBDA)) {
            const param = this.expect(TokenType.IDENT).value;
            this.expect(TokenType.DOT);
            const body = this.parseTerm();
            return { type: 'Abs', param, body };
        } else {
            return this.parseApplication();
        }
    }

    parseApplication() {
        let left = this.parseAtom();
        while (true) {
            const next = this.peek();
            if (next.type === TokenType.IDENT || next.type === TokenType.LPAREN || next.type === TokenType.INT || next.type === TokenType.BOOL) {
                const right = this.parseAtom();
                left = { type: 'App', func: left, arg: right };
            } else if (next.type === TokenType.LAMBDA) {
                 const right = this.parseTerm();
                 left = { type: 'App', func: left, arg: right };
                 break;
            } else {
                break;
            }
        }
        return left;
    }

    parseAtom() {
        if (this.match(TokenType.LPAREN)) {
            const expr = this.parseTerm();
            this.expect(TokenType.RPAREN);
            return expr;
        } else if (this.peek().type === TokenType.IDENT) {
            return { type: 'Var', name: this.consume().value };
        } else if (this.peek().type === TokenType.INT) {
            return { type: 'Lit', value: this.consume().value, valueType: 'Int' };
        } else if (this.peek().type === TokenType.BOOL) {
            return { type: 'Lit', value: this.consume().value, valueType: 'Bool' };
        } else {
             throw new Error(`Unexpected token ${this.peek().type} at ${this.peek().pos}`);
        }
    }
}

// --- 2. Type System ---

let typeVarCount = 0;
function freshTVar() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    let n = typeVarCount++;
    do {
        name = letters[n % 26] + name;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return { type: 'TVar', name };
}

function resetTypeVars() {
    typeVarCount = 0;
}

const typeInt = { type: 'TCon', name: 'Int' };
const typeBool = { type: 'TCon', name: 'Bool' };

// --- 3. Inference Logic ---

function applySubst(subst, type) {
    if (type.type === 'TVar') {
        if (subst[type.name]) {
            return applySubst(subst, subst[type.name]);
        }
        return type;
    } else if (type.type === 'TArr') {
        return {
            type: 'TArr',
            src: applySubst(subst, type.src),
            dest: applySubst(subst, type.dest)
        };
    } else {
        return type;
    }
}

function applySubstScheme(subst, scheme) {
    const newSubst = { ...subst };
    scheme.vars.forEach(v => delete newSubst[v]); // Don't substitute bound variables
    return {
        vars: scheme.vars,
        type: applySubst(newSubst, scheme.type)
    };
}

function composeSubst(s1, s2) {
    const result = { ...s2 };
    for (const key in s1) {
        result[key] = applySubst(s2, s1[key]);
    }
    return result;
}

function freeTypeVars(type) {
    if (type.type === 'TVar') {
        return new Set([type.name]);
    } else if (type.type === 'TArr') {
        const s1 = freeTypeVars(type.src);
        const s2 = freeTypeVars(type.dest);
        return new Set([...s1, ...s2]);
    }
    return new Set();
}

function freeTypeVarsScheme(scheme) {
    const ftv = freeTypeVars(scheme.type);
    scheme.vars.forEach(v => ftv.delete(v));
    return ftv;
}

function instantiate(scheme) {
    const subst = {};
    scheme.vars.forEach(v => {
        subst[v] = freshTVar();
    });
    return applySubst(subst, scheme.type);
}

function generalize(env, type) {
    const envFreeVars = new Set();
    Object.values(env).forEach(scheme => {
        freeTypeVarsScheme(scheme).forEach(v => envFreeVars.add(v));
    });

    const typeFV = freeTypeVars(type);
    const generalizedVars = [];
    typeFV.forEach(v => {
        if (!envFreeVars.has(v)) {
            generalizedVars.push(v);
        }
    });

    return { vars: generalizedVars, type };
}

let constraintsLog = [];

function unify(t1, t2) {
    constraintsLog.push({ t1: typeToString(t1), t2: typeToString(t2) });

    if (t1.type === 'TVar' && t2.type === 'TVar' && t1.name === t2.name) {
        return {};
    }
    if (t1.type === 'TCon' && t2.type === 'TCon' && t1.name === t2.name) {
        return {};
    }
    if (t1.type === 'TVar') {
        return bind(t1.name, t2);
    }
    if (t2.type === 'TVar') {
        return bind(t2.name, t1);
    }
    if (t1.type === 'TArr' && t2.type === 'TArr') {
        const s1 = unify(t1.src, t2.src);
        const s2 = unify(applySubst(s1, t1.dest), applySubst(s1, t2.dest));
        return composeSubst(s1, s2);
    }
    throw new Error(`Type mismatch: ${typeToString(t1)} vs ${typeToString(t2)}`);
}

function bind(name, type) {
    if (type.type === 'TVar' && type.name === name) return {};
    if (freeTypeVars(type).has(name)) {
        throw new Error(`Infinite type: ${name} in ${typeToString(type)}`);
    }
    const subst = {};
    subst[name] = type;
    return subst;
}

function infer(env, expr) {
    if (expr.type === 'Var') {
        const scheme = env[expr.name];
        if (!scheme) throw new Error(`Unknown variable: ${expr.name}`);
        return { subst: {}, type: instantiate(scheme) };
    } else if (expr.type === 'Lit') {
        if (expr.valueType === 'Int') return { subst: {}, type: typeInt };
        if (expr.valueType === 'Bool') return { subst: {}, type: typeBool };
    } else if (expr.type === 'Abs') {
        const tv = freshTVar();
        const newEnv = { ...env, [expr.param]: { vars: [], type: tv } };
        const { subst: s1, type: t1 } = infer(newEnv, expr.body);
        return {
            subst: s1,
            type: { type: 'TArr', src: applySubst(s1, tv), dest: t1 }
        };
    } else if (expr.type === 'App') {
        const tv = freshTVar();
        const { subst: s1, type: t1 } = infer(env, expr.func);
        const { subst: s2, type: t2 } = infer(applyEnv(s1, env), expr.arg);
        const s3 = unify(applySubst(s2, t1), { type: 'TArr', src: t2, dest: tv });
        return {
            subst: composeSubst(s3, composeSubst(s2, s1)), // s3 o s2 o s1
            type: applySubst(s3, tv)
        };
    } else if (expr.type === 'Let') {
        const { subst: s1, type: t1 } = infer(env, expr.value);
        const newEnv = applyEnv(s1, env);
        const scheme = generalize(newEnv, t1);
        const { subst: s2, type: t2 } = infer({ ...newEnv, [expr.name]: scheme }, expr.body);
        return {
            subst: composeSubst(s2, s1),
            type: t2
        };
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
}

function applyEnv(subst, env) {
    const newEnv = {};
    for (const key in env) {
        newEnv[key] = applySubstScheme(subst, env[key]);
    }
    return newEnv;
}

// --- 4. Visualization Helpers ---

function typeToString(type) {
    if (type.type === 'TVar') return type.name;
    if (type.type === 'TCon') return type.name;
    if (type.type === 'TArr') {
        let src = typeToString(type.src);
        let dest = typeToString(type.dest);
        if (type.src.type === 'TArr') src = `(${src})`;
        return `${src} → ${dest}`;
    }
    return '?';
}

function astToString(ast, indent = 0) {
    const prefix = '  '.repeat(indent);
    if (ast.type === 'Var') return `${prefix}Var(${ast.name})`;
    if (ast.type === 'Lit') return `${prefix}Lit(${ast.value})`;
    if (ast.type === 'Abs') return `${prefix}Abs(${ast.param})\n${astToString(ast.body, indent + 1)}`;
    if (ast.type === 'App') return `${prefix}App\n${astToString(ast.func, indent + 1)}\n${astToString(ast.arg, indent + 1)}`;
    if (ast.type === 'Let') return `${prefix}Let ${ast.name} =\n${astToString(ast.value, indent + 1)}\n${prefix}In\n${astToString(ast.body, indent + 1)}`;
    return '';
}

function renderAST(ast, element) {
    element.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = astToString(ast);
    element.appendChild(pre);
}

function renderConstraints(constraints, element) {
    element.innerHTML = '';
    const ul = document.createElement('ul');
    constraints.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.t1} ~ ${c.t2}`;
        ul.appendChild(li);
    });
    element.appendChild(ul);
}

function renderSubstitutions(subst, element) {
    element.innerHTML = '';
    const ul = document.createElement('ul');
    if (Object.keys(subst).length === 0) {
        const li = document.createElement('li');
        li.textContent = "Identity (no substitutions)";
        ul.appendChild(li);
        return;
    }
    for (const key in subst) {
        const li = document.createElement('li');
        li.textContent = `${key} ↦ ${typeToString(subst[key])}`;
        ul.appendChild(li);
    }
    element.appendChild(ul);
}

function renderType(type, element) {
    element.textContent = typeToString(type);
}

// --- 5. Main Loop ---

const inputEl = document.getElementById('expression-input');
const errorEl = document.getElementById('error-message');
const astEl = document.getElementById('ast-display');
const typeEl = document.getElementById('type-display');
const constraintsEl = document.getElementById('constraints-display');
const substEl = document.getElementById('substitution-display');

function update() {
    const code = inputEl.value;
    if (!code.trim()) {
        errorEl.textContent = '';
        return;
    }

    try {
        errorEl.textContent = '';
        resetTypeVars();
        constraintsLog = [];

        const tokens = lex(code);
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // Initial environment
        const env = {};

        const { subst, type } = infer(env, ast);
        const finalType = applySubst(subst, type);

        renderAST(ast, astEl);
        renderType(finalType, typeEl);
        renderConstraints(constraintsLog, constraintsEl);
        renderSubstitutions(subst, substEl);

    } catch (e) {
        errorEl.textContent = e.message;
        // console.error(e);
        typeEl.textContent = '';
        astEl.innerHTML = '';
        constraintsEl.innerHTML = '';
        substEl.innerHTML = '';
    }
}

inputEl.addEventListener('input', update);

// Initial run
inputEl.value = '\\x.x';
update();
