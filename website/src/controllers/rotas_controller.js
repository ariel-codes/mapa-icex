import { Controller } from '@hotwired/stimulus'
import explode from '@turf/explode'
import pointsWithinPolygon from '@turf/points-within-polygon'
import { getCluster } from '@turf/clusters'
import PathFinder from 'geojson-path-finder'

export default class extends Controller {
  static targets = ['origem', 'destino', 'saida']

  async connect() {
    console.debug("Conectado ao controller de rotas")
    try {
      this.disable()

      const origens = (await (await fetch('/pontos-interesse-z.geojson')).json())
      origens.features.forEach(origem => {
        const option = document.createElement('option')
        option.text = origem.properties.nome
        option.value = JSON.stringify(origem)
        this.origemTarget.appendChild(option)
      })

      const salas = (await (await fetch('/salas.json')).json()).records
      salas.forEach(sala => {
        if (sala.nome_sala.includes("CAD3") ||
          sala.nome_sala.includes("DCC") ||
          sala.nome_sala.includes("LAB. FIS") || sala.nome_sala.includes("LAB FIS") ||
          sala.nome_sala.includes("DQ")) return

        const option = document.createElement('option')
        option.value = sala.nome_sala
        option.text = `${sala.codigo_materia} - ${sala.turma} - ${sala.nome_sala}`
        this.destinoTarget.appendChild(option)
      });

      this.salasGeo = await (await fetch('/salas-z.geojson')).json()
      this.rotasGeo = await (await fetch('/rotas-z.geojson')).json()
      this.rotasGeoPoints = explode(this.rotasGeo)

      this.pathFinder = new PathFinder(await (await fetch('/rotas-z.geojson')).json());
    } catch (error) {
      console.debug("Erro ao carregar salas", error)
    } finally {
      this.enable()
    }
  }

  disable() {
    this.origemTarget.disabled = true
    this.destinoTarget.disabled = true
    this.saidaTarget.disabled = true
  }

  enable() {
    this.origemTarget.disabled = false
    this.destinoTarget.disabled = false
    this.saidaTarget.disabled = false
  }

  buscarRedeSala(sala) {
    const salaGeo = this.salasGeo.features.find(f => f.properties.sala == sala)
    console.debug("Sala", salaGeo)
    const rotasNoAndar = getCluster(this.rotasGeoPoints, { andar: salaGeo.properties.andar })
    const entradaRotaSala = pointsWithinPolygon(rotasNoAndar, salaGeo)
    console.debug("Saída Rota Sala", entradaRotaSala)
    return entradaRotaSala.features[0]
  }

  calcular(event) {
    event.preventDefault()
    const pontoEntrada = JSON.parse(this.origemTarget.value)
    const pontoSaida = this.buscarRedeSala(this.destinoTarget.value)
    console.debug(`Origem:`, { pontoEntrada, pontoSaida })

    const rota = this.pathFinder.findPath(pontoEntrada, pontoSaida)
    alert(`Rota: ${JSON.stringify(rota)}`)
  }
}
